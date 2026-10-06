"use server";
import { revalidatePath } from "next/cache";
import { assertUser, AuthError } from "@/lib/session";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";
import { cancelOrder, CheckoutError } from "@/server/orders";

export async function cancelMyOrder(orderId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const session = await assertUser();
    await connectDB();
    const order = await Order.findOne({ _id: orderId, userId: session.user.id }).select("status").lean();
    if (!order) return { ok: false, error: "Order not found." };
    if (!["pending_payment", "confirmed"].includes(order.status)) return { ok: false, error: "This order can’t be cancelled online any more. Contact us for help." };
    await cancelOrder(orderId, "customer", "Cancelled by customer");
    revalidatePath(`/account/orders/${orderId}`);
    return { ok: true };
  } catch (e) {
    if (e instanceof CheckoutError || e instanceof AuthError) return { ok: false, error: e.message };
    throw e;
  }
}
