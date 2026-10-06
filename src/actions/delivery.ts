"use server";
import { z } from "zod";
import { checkServiceability, type Serviceability } from "@/server/shipping";

const Input = z.object({ pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/), weightKg: z.number().min(0.1).max(50).optional() });

export async function checkDelivery(input: { pincode: string; weightKg?: number }): Promise<Serviceability | { error: string }> {
  const parsed = Input.safeParse(input);
  if (!parsed.success) return { error: "Enter a valid 6-digit pincode." };
  try {
    return await checkServiceability(parsed.data.pincode, parsed.data.weightKg);
  } catch (e) {
    console.warn("serviceability check failed", e);
    return { error: "We couldn’t check this pincode right now. You can still place the order — we’ll confirm delivery by phone." };
  }
}
