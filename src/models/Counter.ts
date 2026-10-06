import { Schema, model, models, type Model } from "mongoose";

const CounterSchema = new Schema({ _id: { type: String, required: true }, seq: { type: Number, default: 0 } });
type CounterDoc = { _id: string; seq: number };
export const Counter: Model<CounterDoc> =
  (models.Counter as Model<CounterDoc>) ?? model<CounterDoc>("Counter", CounterSchema);

/** Atomic, gap-tolerant sequence: HB10001, HB10002, … */
export async function nextOrderNumber(): Promise<string> {
  const c = await Counter.findOneAndUpdate({ _id: "order" }, { $inc: { seq: 1 } }, { upsert: true, returnDocument: "after" });
  return `HB${10000 + c.seq}`;
}
