import { Schema, model, models, type InferSchemaType, type Model, Types } from "mongoose";

export const AddressFields = {
  name: { type: String, required: true, trim: true, maxlength: 80 },
  phone: { type: String, required: true, trim: true },
  line1: { type: String, required: true, trim: true, maxlength: 160 },
  line2: { type: String, trim: true, maxlength: 160, default: "" },
  landmark: { type: String, trim: true, maxlength: 80, default: "" },
  city: { type: String, required: true, trim: true, maxlength: 60 },
  state: { type: String, required: true, trim: true, maxlength: 60 },
  pincode: { type: String, required: true, trim: true },
} as const;

const AddressSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    ...AddressFields,
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export type AddressDoc = InferSchemaType<typeof AddressSchema> & { _id: Types.ObjectId };
export const Address: Model<AddressDoc> =
  (models.Address as Model<AddressDoc>) ?? model<AddressDoc>("Address", AddressSchema);
