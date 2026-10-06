import type { BadgeTone } from "@/components/ui/badge";
import type { OrderStatus } from "@/models/Order";

export const STATUS_META: Record<OrderStatus, { label: string; tone: BadgeTone; customer: string }> = {
  pending_payment: { label: "Awaiting payment", tone: "marigold-soft", customer: "Payment not completed" },
  confirmed: { label: "Confirmed", tone: "info", customer: "Order confirmed" },
  on_hold: { label: "On hold", tone: "danger", customer: "On hold — we’ll contact you" },
  packed: { label: "Packed", tone: "info", customer: "Packed at the nursery" },
  shipped: { label: "Shipped", tone: "leaf", customer: "Shipped" },
  out_for_delivery: { label: "Out for delivery", tone: "leaf", customer: "Out for delivery" },
  delivered: { label: "Delivered", tone: "dark", customer: "Delivered" },
  cancelled: { label: "Cancelled", tone: "neutral", customer: "Cancelled" },
  returned: { label: "Returned", tone: "neutral", customer: "Returned to nursery" },
};

/** The happy path shown as a progress tracker to customers. */
export const TRACK_STEPS: { status: OrderStatus; label: string }[] = [
  { status: "confirmed", label: "Confirmed" },
  { status: "packed", label: "Packed" },
  { status: "shipped", label: "Shipped" },
  { status: "out_for_delivery", label: "Out for delivery" },
  { status: "delivered", label: "Delivered" },
];

export const PAYMENT_LABEL: Record<string, string> = {
  pending: "Payment pending",
  paid: "Paid online",
  failed: "Payment failed",
  refunded: "Refunded",
  cod_pending: "Cash on delivery",
  cod_collected: "Cash collected",
};
