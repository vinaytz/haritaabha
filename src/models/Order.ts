import { Schema, model, models, type InferSchemaType, type Model, type QueryFilter, Types } from "mongoose";
import { AddressFields } from "./Address";

export const ORDER_STATUSES = [
  "pending_payment",
  "confirmed",
  "on_hold",
  "packed",
  "shipped",
  "out_for_delivery",
  "delivered",
  "cancelled",
  "returned",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PAYMENT_METHODS = ["razorpay", "cod"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];
export const PAYMENT_STATUSES = ["pending", "paid", "failed", "refunded", "cod_pending", "cod_collected"] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

const ItemSchema = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    slug: { type: String, required: true },
    image: { type: String, default: "" },
    sku: { type: String, default: "" },
    price: { type: Number, required: true }, // paise, at time of purchase
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false },
);

const TimelineSchema = new Schema(
  {
    status: { type: String, required: true },
    note: { type: String, default: "" },
    at: { type: Date, default: () => new Date() },
    by: { type: String, default: "system" }, // system | customer | admin | courier
  },
  { _id: false },
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    email: { type: String, required: true },
    items: { type: [ItemSchema], required: true },
    address: { type: new Schema(AddressFields, { _id: false }), required: true },
    amounts: {
      type: new Schema(
        {
          subtotal: { type: Number, required: true },
          shipping: { type: Number, required: true, default: 0 },
          codFee: { type: Number, required: true, default: 0 },
          total: { type: Number, required: true },
        },
        { _id: false },
      ),
      required: true,
    },
    payment: {
      type: new Schema(
        {
          method: { type: String, enum: PAYMENT_METHODS, required: true },
          status: { type: String, enum: PAYMENT_STATUSES, required: true },
          razorpayOrderId: { type: String },
          razorpayPaymentId: { type: String },
          paidAt: { type: Date },
          mock: { type: Boolean, default: false },
        },
        { _id: false },
      ),
      required: true,
    },
    status: { type: String, enum: ORDER_STATUSES, required: true },
    stockDeducted: { type: Boolean, default: false },
    timeline: { type: [TimelineSchema], default: [] },
    shipment: {
      provider: { type: String, default: "" }, // shiprocket | mock
      shiprocketOrderId: { type: String },
      shipmentId: { type: String },
      awb: { type: String },
      courier: { type: String },
      labelUrl: { type: String },
      trackingUrl: { type: String },
      etd: { type: Date },
      lastEvent: { type: String },
      lastEventAt: { type: Date },
      cost: { type: Number }, // paise — estimated courier charge to the store (freight + COD charge)
      issue: { type: String, default: "" }, // courier problem the admin should act on (failed delivery, RTO, lost…)
    },
    adminNote: { type: String, default: "" },
    customerNote: { type: String, default: "", maxlength: 300 },
  },
  { timestamps: true },
);

OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ "payment.razorpayOrderId": 1 }, { unique: true, sparse: true });
OrderSchema.index({ "shipment.awb": 1 }, { sparse: true });
OrderSchema.index({ "shipment.shipmentId": 1 }, { sparse: true });
OrderSchema.index({ "payment.razorpayPaymentId": 1 }, { sparse: true });

export type OrderDoc = InferSchemaType<typeof OrderSchema> & { _id: Types.ObjectId; createdAt: Date; updatedAt: Date };
export const Order: Model<OrderDoc> = (models.Order as Model<OrderDoc>) ?? model<OrderDoc>("Order", OrderSchema);

const PROBLEM_CONDITIONS: QueryFilter<OrderDoc>[] = [
  { status: "on_hold" },
  { "shipment.issue": { $nin: ["", null] } },
  { status: { $in: ["cancelled", "returned"] }, "payment.status": "paid" },
];

/** Orders with a problem: on hold, courier issue, or a refund owed. */
export const ORDER_PROBLEMS: QueryFilter<OrderDoc> = { $or: PROBLEM_CONDITIONS };

/** Everything the admin has to act on: problems plus orders waiting to be packed. */
export const NEEDS_ATTENTION: QueryFilter<OrderDoc> = { $or: [{ status: "confirmed" }, ...PROBLEM_CONDITIONS] };
