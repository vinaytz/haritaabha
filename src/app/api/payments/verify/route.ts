import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { integrations, paymentsMocked } from "@/lib/env";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { getSession } from "@/lib/session";
import { confirmPaidOrder, markPaymentFailed } from "@/server/orders";
import { connectDB } from "@/lib/db";
import { Order } from "@/models";

const Body = z.object({
  razorpay_order_id: z.string().min(1).max(100),
  razorpay_payment_id: z.string().max(100).optional(),
  razorpay_signature: z.string().max(200).optional(),
  failed: z.string().max(300).optional(),
});

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature, failed } = parsed.data;

  await connectDB();
  const order = await Order.findOne({ "payment.razorpayOrderId": orderId }).select("userId").lean();
  if (!order || order.userId !== session.user.id) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  if (failed) {
    await markPaymentFailed(orderId, failed);
    return NextResponse.json({ ok: false });
  }

  const isMock = orderId.startsWith("mock_order_");
  if (isMock) {
    // Mock payments exist only for dev/staging demos without Razorpay keys.
    if (!paymentsMocked) return NextResponse.json({ error: "Mock payments are disabled" }, { status: 400 });
  } else {
    if (!integrations.razorpay || !paymentId || !signature || !verifyPaymentSignature(orderId, paymentId, signature)) {
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }
  }

  const result = await confirmPaidOrder(orderId, paymentId || `mock_pay_${Date.now()}`, "checkout");
  return NextResponse.json({ ok: true, ...result });
}
