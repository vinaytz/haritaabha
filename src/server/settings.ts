import "server-only";
import { cache } from "react";
import { connectDB } from "@/lib/db";
import { Settings } from "@/models";
import type { StoreSettings } from "@/lib/types";

export const getSettings = cache(async (): Promise<StoreSettings> => {
  await connectDB();
  const s = (await Settings.findOneAndUpdate(
    { key: "store" },
    { $setOnInsert: { key: "store" } },
    { upsert: true, returnDocument: "after", lean: true },
  ))!;
  return {
    shippingFee: s.shippingFee,
    freeShippingThreshold: s.freeShippingThreshold,
    codEnabled: s.codEnabled,
    codFee: s.codFee,
    codMaxOrder: s.codMaxOrder,
    announcement: s.announcement,
    supportPhone: s.supportPhone,
    supportEmail: s.supportEmail,
  };
});

export function shippingFor(subtotal: number, s: StoreSettings) {
  if (subtotal === 0) return 0;
  if (s.freeShippingThreshold > 0 && subtotal >= s.freeShippingThreshold) return 0;
  return s.shippingFee;
}
