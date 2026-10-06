import "server-only";
import { connectDB } from "@/lib/db";
import { Address, Order } from "@/models";
import { serialize } from "@/lib/utils";

export type SavedAddress = {
  _id: string;
  name: string;
  phone: string;
  line1: string;
  line2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

export async function getAddresses(userId: string): Promise<SavedAddress[]> {
  await connectDB();
  const docs = await Address.find({ userId }).sort({ isDefault: -1, updatedAt: -1 }).lean();
  return serialize<SavedAddress[]>(docs);
}

export async function getUserOrders(userId: string) {
  await connectDB();
  return Order.find({ userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .select("orderNumber items amounts status payment.method payment.status createdAt shipment.etd")
    .lean();
}

export async function getUserOrder(userId: string, id: string) {
  await connectDB();
  if (!/^[a-f0-9]{24}$/.test(id)) return null;
  return Order.findOne({ _id: id, userId }).lean();
}
