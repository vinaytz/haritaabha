import { z } from "zod";
import { INDIAN_STATES } from "./india";

export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a 10-digit Indian mobile number"));

export const addressSchema = z.object({
  name: z.string().trim().min(2, "Enter the recipient’s name").max(80),
  phone: phoneSchema,
  line1: z.string().trim().min(5, "Enter house number and street").max(160),
  line2: z.string().trim().max(160).optional().default(""),
  landmark: z.string().trim().max(80).optional().default(""),
  city: z.string().trim().min(2, "Enter the city").max(60),
  state: z.enum(INDIAN_STATES, { message: "Choose a state" }),
  pincode: z.string().trim().regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit pincode"),
});
export type AddressInput = z.infer<typeof addressSchema>;
