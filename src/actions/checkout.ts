"use server";
import { z } from "zod";
import { Types } from "mongoose";
import { assertUser, AuthError } from "@/lib/session";
import { addressSchema } from "@/lib/validation";
import { CheckoutError, placeOrder, quote } from "@/server/orders";
import { connectDB } from "@/lib/db";
import { Address } from "@/models";
import { checkServiceability } from "@/server/shipping";

const Items = z
  .array(z.object({ productId: z.string().refine((s) => Types.ObjectId.isValid(s)), quantity: z.number().int().min(1).max(10) }))
  .min(1)
  .max(30);

export async function getQuote(input: { items: { productId: string; quantity: number }[]; method: "razorpay" | "cod" }) {
  const items = Items.parse(input.items);
  const q = await quote(items, input.method === "cod" ? "cod" : "razorpay");
  return {
    subtotal: q.subtotal,
    shipping: q.shipping,
    codFee: q.codFee,
    total: q.total,
    codAllowed: q.codAllowed,
    codFeeIfChosen: q.codFeeIfChosen,
    onlineAllowed: q.onlineAllowed,
    problems: q.problems,
    weightKg: q.weightKg,
  };
}

const PlaceInput = z.object({
  items: Items,
  method: z.enum(["razorpay", "cod"]),
  addressId: z.string().optional(),
  address: addressSchema.optional(),
  saveAddress: z.boolean().optional(),
  note: z.string().max(300).optional(),
});

export type PlaceOrderResult =
  | { ok: true; kind: "cod"; orderId: string; orderNumber: string }
  | {
      ok: true;
      kind: "razorpay";
      orderId: string;
      orderNumber: string;
      razorpay: { keyId: string; orderId: string; amount: number; mock: boolean };
      prefill: { name: string; email: string; contact: string };
    }
  | { ok: false; error: string };

export async function placeOrderAction(raw: z.input<typeof PlaceInput>): Promise<PlaceOrderResult> {
  try {
    const session = await assertUser();
    const input = PlaceInput.parse(raw);
    await connectDB();

    let address = input.address;
    if (input.addressId) {
      const saved = await Address.findOne({ _id: input.addressId, userId: session.user.id }).lean();
      if (!saved) return { ok: false, error: "That address wasn’t found. Choose another." };
      address = addressSchema.parse(saved);
    }
    if (!address) return { ok: false, error: "Add a delivery address." };

    // If Shiprocket is down we still take the order (admin sees it before shipping); the failure is logged.
    const svc = await checkServiceability(address.pincode).catch((e) => {
      console.warn("serviceability check failed", e);
      return null;
    });
    if (svc && !svc.deliverable) return { ok: false, error: `We don’t deliver to ${address.pincode} yet.` };
    if (svc && input.method === "cod" && !svc.cod) return { ok: false, error: "Cash on delivery isn’t available for this pincode. Please pay online." };

    if (input.address && input.saveAddress) {
      const count = await Address.countDocuments({ userId: session.user.id });
      await Address.create({ ...input.address, userId: session.user.id, isDefault: count === 0 });
    }

    const res = await placeOrder({
      userId: session.user.id,
      email: session.user.email,
      items: input.items,
      address,
      method: input.method,
      note: input.note,
    });
    if (res.kind === "cod") return { ok: true, ...res };
    return { ok: true, ...res, prefill: { name: address.name, email: session.user.email, contact: address.phone } };
  } catch (err) {
    if (err instanceof CheckoutError || err instanceof AuthError) return { ok: false, error: err.message };
    if (err instanceof z.ZodError) return { ok: false, error: "Some details look wrong. Check the form and try again." };
    console.error("placeOrder failed", err);
    return { ok: false, error: "Something went wrong placing your order. You haven’t been charged — please try again." };
  }
}
