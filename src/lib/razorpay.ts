import "server-only";
import crypto from "node:crypto";
import Razorpay from "razorpay";
import { env, integrations } from "./env";

let client: Razorpay | null = null;
function rz() {
  if (!integrations.razorpay) throw new Error("Razorpay is not configured");
  client ??= new Razorpay({ key_id: env.razorpay.keyId, key_secret: env.razorpay.keySecret });
  return client;
}

export async function createRazorpayOrder(amountPaise: number, receipt: string, notes: Record<string, string>) {
  const order = await rz().orders.create({ amount: amountPaise, currency: "INR", receipt, notes });
  return { id: order.id, amount: Number(order.amount) };
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

/** Checkout.js success handler signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret). */
export function verifyPaymentSignature(orderId: string, paymentId: string, signature: string) {
  const expected = crypto.createHmac("sha256", env.razorpay.keySecret).update(`${orderId}|${paymentId}`).digest("hex");
  return safeEqual(expected, signature);
}

/** Webhook signature: HMAC_SHA256(raw body, webhook secret). Must use the raw request body. */
export function verifyWebhookSignature(rawBody: string, signature: string) {
  if (!env.razorpay.webhookSecret) return false;
  const expected = crypto.createHmac("sha256", env.razorpay.webhookSecret).update(rawBody).digest("hex");
  return safeEqual(expected, signature);
}

export async function refundPayment(paymentId: string, amountPaise?: number) {
  return rz().payments.refund(paymentId, amountPaise ? { amount: amountPaise } : {});
}
