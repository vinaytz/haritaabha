"use server";
import { z } from "zod";
import { Types } from "mongoose";
import { connectDB } from "@/lib/db";
import { Product } from "@/models";

const Ids = z.array(z.string().refine((s) => Types.ObjectId.isValid(s))).max(50);

/** Fresh price/stock for cart lines. Missing = deleted or deactivated products. */
export async function refreshCart(productIds: string[]) {
  const ids = Ids.parse(productIds);
  if (!ids.length) return { fresh: [], missing: [] };
  await connectDB();
  const docs = await Product.find({ _id: { $in: ids }, isActive: true })
    .select("name slug images price compareAtPrice stock")
    .lean();
  const fresh = docs.map((d) => ({
    productId: String(d._id),
    name: d.name,
    slug: d.slug,
    image: d.images?.[0]?.url ?? null,
    price: d.price,
    compareAtPrice: d.compareAtPrice ?? null,
    maxQty: d.stock,
  }));
  const found = new Set(fresh.map((f) => f.productId));
  return { fresh, missing: ids.filter((id) => !found.has(id)) };
}
