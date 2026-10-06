import "server-only";
import mongoose, { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { canPayOnline, env, integrations, paymentsMocked } from "@/lib/env";
import { createRazorpayOrder } from "@/lib/razorpay";
import { Order, Product, nextOrderNumber, type OrderDoc, type OrderStatus } from "@/models";
import { getSettings, shippingFor } from "./settings";
import type { AddressInput } from "@/lib/validation";

export class CheckoutError extends Error {}

export type CartItemInput = { productId: string; quantity: number };

/** Re-price a cart from the database. Never trusts client prices. */
export async function priceCart(items: CartItemInput[]) {
  await connectDB();
  const ids = items.filter((i) => Types.ObjectId.isValid(i.productId)).map((i) => new Types.ObjectId(i.productId));
  const products = await Product.find({ _id: { $in: ids }, isActive: true })
    .select("name slug images price stock sku shipping")
    .lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));

  const lines = [];
  const problems: string[] = [];
  for (const item of items) {
    const p = byId.get(item.productId);
    if (!p) {
      problems.push("An item in your cart is no longer available.");
      continue;
    }
    const qty = Math.floor(item.quantity);
    if (qty < 1 || qty > 10) throw new CheckoutError("Invalid quantity.");
    if (p.stock < qty) {
      problems.push(p.stock === 0 ? `${p.name} is sold out.` : `Only ${p.stock} of ${p.name} left.`);
      continue;
    }
    lines.push({
      product: p._id,
      name: p.name,
      slug: p.slug,
      image: p.images?.[0]?.url ?? "",
      sku: p.sku ?? "",
      price: p.price,
      quantity: qty,
      weightKg: p.shipping?.weightKg ?? 1,
    });
  }
  const subtotal = lines.reduce((n, l) => n + l.price * l.quantity, 0);
  const weightKg = lines.reduce((n, l) => n + l.weightKg * l.quantity, 0);
  return { lines, subtotal, weightKg, problems };
}

export async function quote(items: CartItemInput[], method: "razorpay" | "cod") {
  const settings = await getSettings();
  const priced = await priceCart(items);
  const shipping = shippingFor(priced.subtotal, settings);
  const codAllowed = settings.codEnabled && priced.subtotal + shipping <= settings.codMaxOrder;
  const codFee = method === "cod" && codAllowed ? settings.codFee : 0;
  return {
    ...priced,
    shipping,
    codFee,
    total: priced.subtotal + shipping + codFee,
    codAllowed,
    codFeeIfChosen: settings.codFee,
    onlineAllowed: canPayOnline,
  };
}

/** Atomically deduct stock for all lines, or none. Returns false if any line lacks stock. */
type StockLines = { items: { product: Types.ObjectId; quantity: number }[] };

async function deductStock(order: StockLines, session: mongoose.ClientSession) {
  for (const item of order.items) {
    const res = await Product.updateOne(
      { _id: item.product, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity, salesCount: item.quantity } },
      { session },
    );
    if (res.modifiedCount !== 1) return false;
  }
  return true;
}

async function restoreStock(order: StockLines, session: mongoose.ClientSession) {
  for (const item of order.items) {
    await Product.updateOne({ _id: item.product }, { $inc: { stock: item.quantity, salesCount: -item.quantity } }, { session });
  }
}

export async function placeOrder(args: {
  userId: string;
  email: string;
  items: CartItemInput[];
  address: AddressInput;
  method: "razorpay" | "cod";
  note?: string;
}) {
  if (!args.items.length) throw new CheckoutError("Your cart is empty.");
  const q = await quote(args.items, args.method);
  if (q.problems.length) throw new CheckoutError(q.problems.join(" "));
  if (!q.lines.length) throw new CheckoutError("Your cart is empty.");
  if (args.method === "cod" && !q.codAllowed) throw new CheckoutError("Cash on delivery isn’t available for this order.");
  if (args.method === "razorpay" && !q.onlineAllowed) throw new CheckoutError("Online payment isn’t available right now.");

  const orderNumber = await nextOrderNumber();
  const base = {
    orderNumber,
    userId: args.userId,
    email: args.email,
    items: q.lines.map((l) => ({ product: l.product, name: l.name, slug: l.slug, image: l.image, sku: l.sku, price: l.price, quantity: l.quantity })),
    address: args.address,
    amounts: { subtotal: q.subtotal, shipping: q.shipping, codFee: q.codFee, total: q.total },
    customerNote: args.note?.slice(0, 300) ?? "",
  };

  if (args.method === "cod") {
    const session = await mongoose.startSession();
    try {
      let created: OrderDoc | null = null;
      await session.withTransaction(async () => {
        const ok = await deductStock(base, session);
        if (!ok) throw new CheckoutError("Some items just sold out. Please review your cart.");
        const [doc] = await Order.create(
          [
            {
              ...base,
              payment: { method: "cod", status: "cod_pending" },
              status: "confirmed",
              stockDeducted: true,
              timeline: [{ status: "confirmed", note: "Order placed with cash on delivery", by: "customer" }],
            },
          ],
          { session },
        );
        created = doc.toObject() as OrderDoc;
      });
      return { kind: "cod" as const, orderId: String(created!._id), orderNumber };
    } finally {
      await session.endSession();
    }
  }

  // Online payment: create the order first, then the Razorpay order that references it.
  const order = await Order.create({
    ...base,
    payment: { method: "razorpay", status: "pending", mock: paymentsMocked },
    status: "pending_payment",
    timeline: [{ status: "pending_payment", note: "Waiting for payment", by: "customer" }],
  });

  const rz = integrations.razorpay
    ? await createRazorpayOrder(q.total, orderNumber, { orderId: String(order._id), orderNumber })
    : { id: `mock_order_${order._id}`, amount: q.total };
  order.payment!.razorpayOrderId = rz.id;
  await order.save();

  return {
    kind: "razorpay" as const,
    orderId: String(order._id),
    orderNumber,
    razorpay: {
      keyId: env.razorpay.keyId,
      orderId: rz.id,
      amount: rz.amount,
      mock: paymentsMocked,
    },
  };
}

/** Called from the verify route and the webhook. Idempotent: the first caller wins. */
export async function confirmPaidOrder(razorpayOrderId: string, razorpayPaymentId: string, source: "checkout" | "webhook") {
  await connectDB();
  const session = await mongoose.startSession();
  try {
    let result: { orderId: string; orderNumber: string; status: OrderStatus } | null = null;
    await session.withTransaction(async () => {
      const order = await Order.findOne({ "payment.razorpayOrderId": razorpayOrderId }).session(session);
      if (!order) throw new CheckoutError("Order not found for this payment.");
      if (order.payment!.status === "paid") {
        result = { orderId: String(order._id), orderNumber: order.orderNumber, status: order.status as OrderStatus };
        return;
      }
      order.payment!.status = "paid";
      order.payment!.razorpayPaymentId = razorpayPaymentId;
      order.payment!.paidAt = new Date();

      if (order.status === "cancelled") {
        // Paid after the customer/admin cancelled: keep it on hold so the admin refunds it.
        order.status = "on_hold";
        order.timeline.push({ status: "on_hold", note: "Payment received for a cancelled order — refund needed", by: "system", at: new Date() });
      } else {
        const ok = await deductStock(order, session);
        if (ok) {
          order.stockDeducted = true;
          order.status = "confirmed";
          order.timeline.push({ status: "confirmed", note: `Payment received (${source})`, by: "system", at: new Date() });
        } else {
          order.status = "on_hold";
          order.timeline.push({ status: "on_hold", note: "Paid, but an item sold out before payment completed — refund or replace", by: "system", at: new Date() });
        }
      }
      await order.save({ session });
      result = { orderId: String(order._id), orderNumber: order.orderNumber, status: order.status as OrderStatus };
    });
    return result!;
  } finally {
    await session.endSession();
  }
}

export async function markPaymentFailed(razorpayOrderId: string, reason: string) {
  await connectDB();
  await Order.updateOne(
    { "payment.razorpayOrderId": razorpayOrderId, "payment.status": "pending" },
    { $set: { "payment.status": "failed" }, $push: { timeline: { status: "pending_payment", note: `Payment failed: ${reason}`, by: "system", at: new Date() } } },
  );
}

/** A refund made outside our admin (e.g. Razorpay dashboard) — mirror it on the order once fully refunded. */
export async function markRefundedFromGateway(razorpayPaymentId: string, refundedPaise: number) {
  await connectDB();
  const order = await Order.findOne({ "payment.razorpayPaymentId": razorpayPaymentId });
  if (!order || order.payment!.status === "refunded") return;
  const full = refundedPaise >= order.amounts.total;
  if (full) {
    order.payment!.status = "refunded";
    if (order.status === "on_hold") order.status = "cancelled";
  }
  order.timeline.push({
    status: order.status,
    note: full ? "Full refund processed on Razorpay" : `Partial refund of ₹${(refundedPaise / 100).toFixed(2)} processed on Razorpay`,
    by: "system",
    at: new Date(),
  });
  await order.save();
}

const CANCELLABLE: OrderStatus[] = ["pending_payment", "confirmed", "on_hold", "packed"];

export async function cancelOrder(orderId: string, by: "customer" | "admin", note: string) {
  await connectDB();
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const order = await Order.findById(orderId).session(session);
      if (!order) throw new CheckoutError("Order not found.");
      if (!CANCELLABLE.includes(order.status as OrderStatus)) throw new CheckoutError("This order can’t be cancelled any more.");
      if (by === "customer" && order.status === "packed") throw new CheckoutError("This order is already packed. Contact us to cancel.");
      if (order.stockDeducted) {
        await restoreStock(order, session);
        order.stockDeducted = false;
      }
      order.status = "cancelled";
      order.timeline.push({
        status: "cancelled",
        note: note + (order.payment!.status === "paid" ? " — refund due" : ""),
        by,
        at: new Date(),
      });
      await order.save({ session });
    });
  } finally {
    await session.endSession();
  }
}
