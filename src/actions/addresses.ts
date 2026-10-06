"use server";
import { revalidatePath } from "next/cache";
import { Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { assertUser } from "@/lib/session";
import { addressSchema } from "@/lib/validation";
import { Address } from "@/models";

type Result = { ok: true; id?: string } | { ok: false; error: string; fieldErrors?: Record<string, string> };

function fieldErrors(err: z.ZodError) {
  return Object.fromEntries(err.issues.map((i) => [String(i.path[0]), i.message]));
}

export async function saveAddress(raw: unknown, id?: string): Promise<Result> {
  const session = await assertUser();
  const parsed = addressSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "Check the highlighted fields.", fieldErrors: fieldErrors(parsed.error) };
  await connectDB();
  if (id) {
    if (!Types.ObjectId.isValid(id)) return { ok: false, error: "Address not found." };
    const res = await Address.updateOne({ _id: id, userId: session.user.id }, { $set: parsed.data });
    if (!res.matchedCount) return { ok: false, error: "Address not found." };
    revalidatePath("/account/addresses");
    return { ok: true, id };
  }
  const count = await Address.countDocuments({ userId: session.user.id });
  if (count >= 10) return { ok: false, error: "You can save up to 10 addresses." };
  const doc = await Address.create({ ...parsed.data, userId: session.user.id, isDefault: count === 0 });
  revalidatePath("/account/addresses");
  return { ok: true, id: String(doc._id) };
}

export async function deleteAddress(id: string): Promise<Result> {
  const session = await assertUser();
  if (!Types.ObjectId.isValid(id)) return { ok: false, error: "Address not found." };
  await connectDB();
  const doc = await Address.findOneAndDelete({ _id: id, userId: session.user.id });
  if (doc?.isDefault) {
    const next = await Address.findOne({ userId: session.user.id }).sort({ createdAt: -1 });
    if (next) await Address.updateOne({ _id: next._id }, { isDefault: true });
  }
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function setDefaultAddress(id: string): Promise<Result> {
  const session = await assertUser();
  if (!Types.ObjectId.isValid(id)) return { ok: false, error: "Address not found." };
  await connectDB();
  await Address.updateMany({ userId: session.user.id }, { isDefault: false });
  await Address.updateOne({ _id: id, userId: session.user.id }, { isDefault: true });
  revalidatePath("/account/addresses");
  return { ok: true };
}
