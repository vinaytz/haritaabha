"use server";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { assertAdmin, AuthError } from "@/lib/session";
import { slugify } from "@/lib/format";
import { CARE_LEVELS, LIGHT_LEVELS, WATER_LEVELS } from "@/lib/plant-care";
import { deleteImage } from "@/lib/imagekit";
import { integrations } from "@/lib/env";
import { refundPayment } from "@/lib/razorpay";
import { Category, Order, Product, Settings, ORDER_STATUSES, type OrderStatus } from "@/models";
import { cancelOrder, CheckoutError } from "@/server/orders";
import { cancelShipment, createShipment, refreshTracking, resolveShipmentIssue, ShipmentError } from "@/server/shipment";

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string; fieldErrors?: Record<string, string> };

async function guard<T>(fn: () => Promise<Result<T>>): Promise<Result<T>> {
  try {
    await assertAdmin();
    await connectDB();
    return await fn();
  } catch (e) {
    if (e instanceof AuthError || e instanceof CheckoutError || e instanceof ShipmentError) return { ok: false, error: e.message };
    if (e instanceof z.ZodError) {
      return { ok: false, error: "Check the highlighted fields.", fieldErrors: Object.fromEntries(e.issues.map((i) => [i.path.join("."), i.message])) };
    }
    if ((e as { code?: number }).code === 11000) return { ok: false, error: "That URL slug is already used. Choose another.", fieldErrors: { slug: "Already in use" } };
    console.error(e);
    return { ok: false, error: "Something went wrong. Try again." };
  }
}

function revalidateStore() {
  revalidatePath("/", "layout");
}

// ─── Products ──────────────────────────────────────────
const rupees = z.coerce.number().min(0).max(1_000_000);
const optNum = z.preprocess((v) => (v === "" || v === null || v === undefined ? null : v), z.coerce.number().min(0).nullable());
const optEnum = <T extends readonly [string, ...string[]]>(values: T) =>
  z.preprocess((v) => (v === "" ? null : v), z.enum(values).nullable());
const triBool = z.preprocess((v) => (v === "" || v === null || v === undefined ? null : v === true || v === "true"), z.boolean().nullable());

const ProductInput = z
  .object({
    name: z.string().trim().min(2, "Enter a name").max(120),
    slug: z.string().trim().max(80).optional().default(""),
    botanicalName: z.string().trim().max(120).default(""),
    category: z.string().refine((s) => Types.ObjectId.isValid(s), "Choose a category"),
    shortDescription: z.string().trim().max(240).default(""),
    description: z.string().trim().max(5000).default(""),
    images: z.array(z.object({ url: z.string().min(1), fileId: z.string().default(""), alt: z.string().max(160).default("") })).max(8),
    price: rupees.refine((v) => v > 0, "Enter a price"),
    compareAtPrice: optNum,
    stock: z.coerce.number().int("Whole numbers only").min(0).max(100000),
    sku: z.string().trim().max(40).default(""),
    care: z.object({
      light: optEnum(LIGHT_LEVELS),
      water: optEnum(WATER_LEVELS),
      level: optEnum(CARE_LEVELS),
      petSafe: triBool,
      airPurifying: z.boolean().default(false),
      notes: z.string().trim().max(2000).default(""),
    }),
    size: z.object({ heightCm: optNum, potSizeIn: optNum, potIncluded: z.boolean().default(true), label: z.string().trim().max(40).default("") }),
    shipping: z.object({
      weightKg: z.coerce.number().min(0.05, "At least 0.05 kg").max(50),
      lengthCm: z.coerce.number().min(1).max(200),
      breadthCm: z.coerce.number().min(1).max(200),
      heightCm: z.coerce.number().min(1).max(250),
    }),
    tags: z.string().default(""),
    isFeatured: z.boolean().default(false),
    isActive: z.boolean().default(true),
  })
  .refine((v) => v.compareAtPrice === null || v.compareAtPrice === 0 || v.compareAtPrice > v.price, {
    path: ["compareAtPrice"],
    message: "Must be higher than the price, or leave empty",
  });

export type ProductFormInput = z.input<typeof ProductInput>;

export async function saveProduct(raw: ProductFormInput, id?: string) {
  return guard<{ id: string; slug: string }>(async () => {
    const v = ProductInput.parse(raw);
    const doc = {
      ...v,
      slug: slugify(v.slug || v.name),
      category: new Types.ObjectId(v.category),
      price: Math.round(v.price * 100),
      compareAtPrice: v.compareAtPrice ? Math.round(v.compareAtPrice * 100) : null,
      tags: v.tags
        .split(",")
        .map((t) => slugify(t))
        .filter(Boolean)
        .slice(0, 20),
    };
    let saved;
    if (id) {
      const before = await Product.findById(id).select("images").lean();
      if (!before) return { ok: false, error: "Product not found." };
      saved = await Product.findByIdAndUpdate(id, { $set: doc }, { returnDocument: "after", runValidators: true });
      const kept = new Set(doc.images.map((i) => i.url));
      await Promise.all((before.images ?? []).filter((i) => !kept.has(i.url)).map((i) => deleteImage(i)));
    } else {
      saved = await Product.create(doc);
    }
    revalidateStore();
    return { ok: true, id: String(saved!._id), slug: saved!.slug };
  });
}

export async function setProductFlags(id: string, flags: { isActive?: boolean; isFeatured?: boolean; stock?: number }) {
  return guard<object>(async () => {
    const set: Record<string, unknown> = {};
    if (typeof flags.isActive === "boolean") set.isActive = flags.isActive;
    if (typeof flags.isFeatured === "boolean") set.isFeatured = flags.isFeatured;
    if (typeof flags.stock === "number" && Number.isInteger(flags.stock) && flags.stock >= 0) set.stock = flags.stock;
    await Product.updateOne({ _id: id }, { $set: set });
    revalidateStore();
    return { ok: true };
  });
}

export async function deleteProduct(id: string) {
  return guard<object>(async () => {
    const inOrders = await Order.exists({ "items.product": id });
    if (inOrders) {
      // Keep order history intact: hide instead of deleting.
      await Product.updateOne({ _id: id }, { $set: { isActive: false } });
      revalidateStore();
      return { ok: false, error: "This product appears in past orders, so it was hidden instead of deleted." };
    }
    const p = await Product.findByIdAndDelete(id);
    if (p) await Promise.all((p.images ?? []).map((i) => deleteImage(i)));
    revalidateStore();
    return { ok: true };
  });
}

// ─── Categories ────────────────────────────────────────
const CategoryInput = z.object({
  name: z.string().trim().min(2, "Enter a name").max(60),
  slug: z.string().trim().max(80).optional().default(""),
  description: z.string().trim().max(400).default(""),
  image: z.object({ url: z.string().default(""), fileId: z.string().default("") }).nullable().default(null),
  isActive: z.boolean().default(true),
});

export async function saveCategory(raw: z.input<typeof CategoryInput>, id?: string) {
  return guard<{ id: string }>(async () => {
    const v = CategoryInput.parse(raw);
    const doc = { ...v, slug: slugify(v.slug || v.name), image: v.image?.url ? v.image : undefined };
    let saved;
    if (id) saved = await Category.findByIdAndUpdate(id, { $set: doc }, { returnDocument: "after" });
    else {
      const last = await Category.findOne().sort({ sortOrder: -1 }).select("sortOrder").lean();
      saved = await Category.create({ ...doc, sortOrder: (last?.sortOrder ?? -1) + 1 });
    }
    revalidateStore();
    return { ok: true, id: String(saved!._id) };
  });
}

export async function deleteCategory(id: string) {
  return guard<object>(async () => {
    const n = await Product.countDocuments({ category: id });
    if (n > 0) return { ok: false, error: `Move or delete its ${n} products first.` };
    const c = await Category.findByIdAndDelete(id);
    if (c?.image?.url) await deleteImage({ url: c.image.url, fileId: c.image.fileId });
    revalidateStore();
    return { ok: true };
  });
}

export async function reorderCategories(ids: string[]) {
  return guard<object>(async () => {
    await Promise.all(ids.map((id, i) => Category.updateOne({ _id: id }, { $set: { sortOrder: i } })));
    revalidateStore();
    return { ok: true };
  });
}

// ─── Orders ────────────────────────────────────────────
const MANUAL_NEXT: Partial<Record<OrderStatus, OrderStatus[]>> = {
  confirmed: ["packed"],
  on_hold: ["confirmed"],
  packed: ["confirmed"],
  shipped: ["out_for_delivery", "delivered", "returned"],
  out_for_delivery: ["delivered", "returned"],
};

export async function updateOrderStatus(id: string, status: string, note = "") {
  return guard<object>(async () => {
    if (!(ORDER_STATUSES as readonly string[]).includes(status)) return { ok: false, error: "Unknown status." };
    const order = await Order.findById(id);
    if (!order) return { ok: false, error: "Order not found." };
    const allowed = MANUAL_NEXT[order.status as OrderStatus] ?? [];
    if (!allowed.includes(status as OrderStatus)) return { ok: false, error: `Can’t move an order from ${order.status} to ${status}.` };
    order.status = status as OrderStatus;
    if (status === "delivered" && order.payment!.method === "cod") order.payment!.status = "cod_collected";
    order.timeline.push({ status, note: note.slice(0, 200) || "Updated by admin", by: "admin", at: new Date() });
    await order.save();
    revalidatePath(`/admin/orders/${id}`);
    return { ok: true };
  });
}

export async function adminCancelOrder(id: string, reason: string) {
  return guard<object>(async () => {
    await cancelOrder(id, "admin", reason.slice(0, 200) || "Cancelled by store");
    revalidatePath(`/admin/orders/${id}`);
    return { ok: true };
  });
}

export async function adminRefund(id: string) {
  return guard<object>(async () => {
    const order = await Order.findById(id);
    if (!order) return { ok: false, error: "Order not found." };
    if (order.payment!.status !== "paid") return { ok: false, error: "Only paid online orders can be refunded." };
    if (!["cancelled", "on_hold", "returned"].includes(order.status)) return { ok: false, error: "Cancel the order before refunding." };
    if (integrations.razorpay && !order.payment!.mock && order.payment!.razorpayPaymentId) {
      try {
        await refundPayment(order.payment!.razorpayPaymentId);
      } catch (e) {
        const why = (e as { error?: { description?: string } }).error?.description;
        console.error("refund failed", e);
        return { ok: false, error: `Razorpay couldn’t refund this payment${why ? `: ${why}` : ""}. You can also refund it from the Razorpay dashboard.` };
      }
    }
    order.payment!.status = "refunded";
    if (order.status === "on_hold") order.status = "cancelled";
    order.timeline.push({ status: order.status, note: "Full refund issued", by: "admin", at: new Date() });
    await order.save();
    revalidatePath(`/admin/orders/${id}`);
    return { ok: true };
  });
}

export async function shipOrder(id: string) {
  return guard<{ awb: string; courier: string; mock: boolean }>(async () => {
    const res = await createShipment(id);
    revalidatePath(`/admin/orders/${id}`);
    return { ok: true, ...res };
  });
}

export async function cancelOrderShipment(id: string) {
  return guard<object>(async () => {
    await cancelShipment(id);
    revalidatePath(`/admin/orders/${id}`);
    return { ok: true };
  });
}

export async function resolveOrderIssue(id: string) {
  return guard<object>(async () => {
    await resolveShipmentIssue(id);
    revalidatePath(`/admin/orders/${id}`);
    return { ok: true };
  });
}

export async function refreshOrderTracking(id: string) {
  return guard<{ status: string }>(async () => {
    const status = await refreshTracking(id);
    revalidatePath(`/admin/orders/${id}`);
    return { ok: true, status };
  });
}

export async function saveAdminNote(id: string, note: string) {
  return guard<object>(async () => {
    await Order.updateOne({ _id: id }, { $set: { adminNote: note.slice(0, 1000) } });
    return { ok: true };
  });
}

// ─── Settings ──────────────────────────────────────────
const SettingsInput = z.object({
  shippingFee: rupees,
  freeShippingThreshold: rupees,
  codEnabled: z.boolean(),
  codFee: rupees,
  codMaxOrder: rupees,
  announcement: z.string().trim().max(160),
  pickupPincode: z.union([z.literal(""), z.string().regex(/^[1-9][0-9]{5}$/, "Enter a 6-digit pincode")]),
  supportPhone: z.string().trim().max(20),
  supportEmail: z.union([z.literal(""), z.string().trim().email("Enter a valid email")]),
});

export async function saveSettings(raw: z.input<typeof SettingsInput>) {
  return guard<object>(async () => {
    const v = SettingsInput.parse(raw);
    await Settings.updateOne(
      { key: "store" },
      {
        $set: {
          ...v,
          shippingFee: Math.round(v.shippingFee * 100),
          freeShippingThreshold: Math.round(v.freeShippingThreshold * 100),
          codFee: Math.round(v.codFee * 100),
          codMaxOrder: Math.round(v.codMaxOrder * 100),
        },
      },
      { upsert: true },
    );
    revalidateStore();
    return { ok: true };
  });
}
