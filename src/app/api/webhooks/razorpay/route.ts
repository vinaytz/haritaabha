import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhookSignature } from "@/lib/razorpay";
import { confirmPaidOrder, markPaymentFailed, markRefundedFromGateway } from "@/server/orders";

type Payload = {
  event: string;
  payload?: {
    payment?: { entity?: { id: string; order_id: string; error_description?: string; amount_refunded?: number } };
    refund?: { entity?: { payment_id: string; amount: number } };
    order?: { entity?: { id: string } };
  };
};

/**
 * Razorpay webhook (payment.captured, order.paid, payment.failed, refund.processed).
 * Backup path for when the customer closes the tab before our verify call runs.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!verifyWebhookSignature(raw, signature)) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  const body = JSON.parse(raw) as Payload;
  const payment = body.payload?.payment?.entity;
  try {
    if ((body.event === "payment.captured" || body.event === "order.paid") && payment?.order_id) {
      await confirmPaidOrder(payment.order_id, payment.id, "webhook");
    } else if (body.event === "payment.failed" && payment?.order_id) {
      await markPaymentFailed(payment.order_id, payment.error_description ?? "failed");
    } else if (body.event === "refund.processed" && body.payload?.refund?.entity) {
      // amount_refunded on the payment is the running total across refunds.
      const refund = body.payload.refund.entity;
      await markRefundedFromGateway(refund.payment_id, payment?.amount_refunded ?? refund.amount);
    }
  } catch (err) {
    // Unknown order ids (e.g. payments from another integration) are acknowledged so Razorpay stops retrying.
    console.error("Razorpay webhook error", body.event, err);
  }
  return NextResponse.json({ ok: true });
}
