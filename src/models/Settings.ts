import { Schema, model, models, type Model } from "mongoose";

/** Single document (key: "store") holding admin-editable store settings. */
const SettingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "store" },
    shippingFee: { type: Number, default: 9900 }, // paise
    freeShippingThreshold: { type: Number, default: 99900 }, // paise; 0 disables free shipping
    codEnabled: { type: Boolean, default: true },
    codFee: { type: Number, default: 4900 }, // paise
    codMaxOrder: { type: Number, default: 500000 }, // paise
    announcement: { type: String, default: "Free delivery on orders above ₹999 · Shipping across India" },
    pickupPincode: { type: String, default: "" },
    supportPhone: { type: String, default: "" },
    supportEmail: { type: String, default: "" },
    shiprocketToken: { type: String, default: "", select: false },
    shiprocketTokenExpiresAt: { type: Date, default: null, select: false },
  },
  { timestamps: true },
);

export type SettingsDoc = {
  key: string;
  shippingFee: number;
  freeShippingThreshold: number;
  codEnabled: boolean;
  codFee: number;
  codMaxOrder: number;
  announcement: string;
  pickupPincode: string;
  supportPhone: string;
  supportEmail: string;
  shiprocketToken?: string;
  shiprocketTokenExpiresAt?: Date | null;
};
export const Settings: Model<SettingsDoc> =
  (models.Settings as Model<SettingsDoc>) ?? model<SettingsDoc>("Settings", SettingsSchema);
