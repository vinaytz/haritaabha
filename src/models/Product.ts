import { Schema, model, models, type InferSchemaType, type Model, Types } from "mongoose";
import { CARE_LEVELS, LIGHT_LEVELS, WATER_LEVELS } from "@/lib/plant-care";

const ImageSchema = new Schema(
  {
    url: { type: String, required: true },
    fileId: { type: String, default: "" }, // ImageKit file id, empty for local/demo files
    alt: { type: String, default: "" },
  },
  { _id: false },
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    botanicalName: { type: String, trim: true, default: "" },
    category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    shortDescription: { type: String, trim: true, maxlength: 240, default: "" },
    description: { type: String, trim: true, maxlength: 5000, default: "" },
    images: { type: [ImageSchema], default: [] },

    price: { type: Number, required: true, min: 0 }, // paise
    compareAtPrice: { type: Number, min: 0, default: null }, // paise, shown struck through
    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String, trim: true, default: "" },

    care: {
      light: { type: String, enum: LIGHT_LEVELS, default: null },
      water: { type: String, enum: WATER_LEVELS, default: null },
      level: { type: String, enum: CARE_LEVELS, default: null },
      petSafe: { type: Boolean, default: null },
      airPurifying: { type: Boolean, default: false },
      notes: { type: String, trim: true, maxlength: 2000, default: "" },
    },
    size: {
      heightCm: { type: Number, min: 0, default: null },
      potSizeIn: { type: Number, min: 0, default: null },
      potIncluded: { type: Boolean, default: true },
      label: { type: String, trim: true, default: "" }, // e.g. "Medium"
    },
    shipping: {
      weightKg: { type: Number, min: 0.05, default: 1 },
      lengthCm: { type: Number, min: 1, default: 20 },
      breadthCm: { type: Number, min: 1, default: 20 },
      heightCm: { type: Number, min: 1, default: 30 },
    },

    tags: { type: [String], default: [] },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    salesCount: { type: Number, default: 0 },
    isDemo: { type: Boolean, default: false, index: true },
  },
  { timestamps: true },
);

ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ isActive: 1, isFeatured: 1 });
ProductSchema.index({ isActive: 1, price: 1 });
ProductSchema.index({ isActive: 1, salesCount: -1 });
ProductSchema.index({ "care.light": 1, isActive: 1 });
ProductSchema.index(
  { name: "text", botanicalName: "text", tags: "text", shortDescription: "text" },
  { weights: { name: 10, botanicalName: 6, tags: 4, shortDescription: 1 }, name: "product_search" },
);

export type ProductDoc = InferSchemaType<typeof ProductSchema> & { _id: Types.ObjectId };
export const Product: Model<ProductDoc> =
  (models.Product as Model<ProductDoc>) ?? model<ProductDoc>("Product", ProductSchema);
