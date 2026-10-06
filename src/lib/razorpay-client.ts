"use client";

type RazorpayOptions = {
  key: string;
  amount: number;
  currency: "INR";
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  theme?: { color?: string };
  handler: (res: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  modal?: { ondismiss?: () => void; confirm_close?: boolean };
};
type RazorpayInstance = { open: () => void; on: (event: string, cb: (res: { error: { description: string } }) => void) => void };

declare global {
  interface Window {
    Razorpay?: new (opts: RazorpayOptions) => RazorpayInstance;
  }
}

let loading: Promise<void> | null = null;
export function loadRazorpay(): Promise<void> {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve();
  loading ??= new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error("Couldn’t load the payment window. Check your connection and try again."));
    };
    document.body.appendChild(s);
  });
  return loading;
}

export async function verifyPayment(body: Record<string, string>) {
  const res = await fetch("/api/payments/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.ok) throw new Error(data.error || "We couldn’t confirm your payment.");
  return data as { ok: true; orderId: string; orderNumber: string; status: string };
}

/**
 * Opens Razorpay Checkout (or the mock dialog handler in demo mode) and resolves once
 * the server has verified the payment. Rejects with "dismissed" if the customer closes it.
 */
export async function payWithRazorpay(opts: {
  keyId: string;
  orderId: string;
  amount: number;
  mock: boolean;
  prefill: { name: string; email: string; contact: string };
  orderNumber: string;
  openMock: () => Promise<boolean>;
}) {
  if (opts.mock) {
    const success = await opts.openMock();
    if (!success) {
      await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razorpay_order_id: opts.orderId, failed: "Test payment declined" }),
      });
      throw new Error("dismissed");
    }
    return verifyPayment({ razorpay_order_id: opts.orderId });
  }

  await loadRazorpay();
  return new Promise<Awaited<ReturnType<typeof verifyPayment>>>((resolve, reject) => {
    const rz = new window.Razorpay!({
      key: opts.keyId,
      amount: opts.amount,
      currency: "INR",
      name: "haritaabha",
      description: `Order ${opts.orderNumber}`,
      order_id: opts.orderId,
      prefill: opts.prefill,
      theme: { color: "#337418" },
      handler: (res) => verifyPayment(res as unknown as Record<string, string>).then(resolve, reject),
      modal: { ondismiss: () => reject(new Error("dismissed")), confirm_close: true },
    });
    rz.on("payment.failed", () => {
      /* Razorpay shows its own retry UI; the webhook records the failure. */
    });
    rz.open();
  });
}
