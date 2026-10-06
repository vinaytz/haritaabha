import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2, ExternalLink, Truck } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getUserOrder } from "@/server/account";
import { Badge } from "@/components/ui/badge";
import { AddressBlock } from "@/components/store/address-form";
import { OrderTracker } from "@/components/store/order-tracker";
import { OrderActions } from "@/components/store/order-actions";
import { formatDate, formatDateTime, formatINR, formatShortDate } from "@/lib/format";
import { PAYMENT_LABEL, STATUS_META } from "@/lib/order-status";
import type { OrderStatus } from "@/models/Order";
import { env, paymentsMocked } from "@/lib/env";

export const metadata: Metadata = { title: "Order details" };

export default async function OrderPage({ params, searchParams }: PageProps<"/account/orders/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const session = await requireUser(`/account/orders/${id}`);
  const order = await getUserOrder(session.user.id, id);
  if (!order) notFound();
  const status = order.status as OrderStatus;
  const meta = STATUS_META[status];
  const placed = sp.placed === "1";

  return (
    <div className="space-y-6">
      {placed && status !== "pending_payment" && (
        <div className="flex gap-4 rounded-[var(--radius-surface)] bg-leaf-tint p-5 md:p-6" role="status">
          <CheckCircle2 className="size-7 shrink-0 text-leaf" strokeWidth={1.8} />
          <div>
            <p className="font-display text-2xl leading-tight">Thank you — your order is confirmed.</p>
            <p className="mt-1 text-ink-soft">
              Your plants will be packed at the nursery within 1–2 working days. You can follow every step on this page.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/account/orders" className="text-sm text-ink-soft hover:text-ink">
            ← All orders
          </Link>
          <h1 className="mt-2 font-display text-[2rem] leading-tight">Order {order.orderNumber}</h1>
          <p className="text-sm text-ink-soft">Placed {formatDateTime(order.createdAt)}</p>
        </div>
        <Badge tone={meta.tone} className="text-sm">{meta.customer}</Badge>
      </div>

      <OrderActions
        orderId={String(order._id)}
        orderNumber={order.orderNumber}
        status={status}
        paymentStatus={order.payment?.status ?? ""}
        razorpayOrderId={order.payment?.razorpayOrderId ?? ""}
        amount={order.amounts.total}
        mock={Boolean(order.payment?.mock) && paymentsMocked}
        keyId={env.razorpay.keyId}
        prefill={{ name: order.address.name, email: order.email, contact: order.address.phone }}
      />

      {!["pending_payment", "cancelled", "returned"].includes(status) && (
        <section className="rounded-[var(--radius-surface)] border border-line p-5 md:p-6">
          <OrderTracker status={status} />
          {order.shipment?.awb && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-control)] bg-mist/60 p-4 text-sm">
              <p className="flex items-center gap-2">
                <Truck className="size-4 text-leaf" />
                <span>
                  {order.shipment.courier || "Courier"} · AWB <span className="font-semibold font-numeric">{order.shipment.awb}</span>
                  {order.shipment.etd && <> · expected {formatShortDate(order.shipment.etd)}</>}
                </span>
              </p>
              {order.shipment.trackingUrl && (
                <a href={order.shipment.trackingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-leaf hover:underline">
                  Track with courier <ExternalLink className="size-3.5" />
                </a>
              )}
            </div>
          )}
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-[1fr_300px]">
        <section className="rounded-[var(--radius-surface)] border border-line p-5 md:p-6">
          <h2 className="font-semibold">Items</h2>
          <ul className="mt-3 divide-y divide-line">
            {order.items.map((i) => (
              <li key={i.slug} className="flex items-center gap-4 py-3">
                <Link href={`/plants/${i.slug}`} className="relative size-16 shrink-0 overflow-hidden rounded-md bg-mist">
                  {i.image && <Image src={i.image} alt={i.name} fill sizes="64px" className="object-cover" />}
                </Link>
                <div className="min-w-0 flex-1">
                  <Link href={`/plants/${i.slug}`} className="font-medium hover:text-leaf-deep">{i.name}</Link>
                  <p className="text-sm text-ink-soft font-numeric">{i.quantity} × {formatINR(i.price)}</p>
                </div>
                <p className="font-medium font-numeric">{formatINR(i.price * i.quantity)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-2 space-y-1.5 border-t border-line pt-4 text-[0.9375rem]">
            <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="font-numeric">{formatINR(order.amounts.subtotal)}</dd></div>
            <div className="flex justify-between"><dt className="text-ink-soft">Delivery</dt><dd className="font-numeric">{order.amounts.shipping ? formatINR(order.amounts.shipping) : "Free"}</dd></div>
            {order.amounts.codFee > 0 && (
              <div className="flex justify-between"><dt className="text-ink-soft">Cash on delivery fee</dt><dd className="font-numeric">{formatINR(order.amounts.codFee)}</dd></div>
            )}
            <div className="flex justify-between border-t border-line pt-2 font-semibold"><dt>Total</dt><dd className="font-numeric">{formatINR(order.amounts.total)}</dd></div>
          </dl>
        </section>
        <div className="space-y-6">
          <section className="rounded-[var(--radius-surface)] border border-line p-5">
            <h2 className="mb-2 font-semibold">Delivery address</h2>
            <AddressBlock a={order.address} />
          </section>
          <section className="rounded-[var(--radius-surface)] border border-line p-5">
            <h2 className="mb-2 font-semibold">Payment</h2>
            <p className="text-[0.9375rem] text-ink-soft">{PAYMENT_LABEL[order.payment?.status ?? ""] ?? "—"}</p>
            {order.payment?.paidAt && <p className="text-sm text-ink-soft">on {formatDate(order.payment.paidAt)}</p>}
          </section>
        </div>
      </div>

      {order.timeline.length > 0 && (
        <section className="rounded-[var(--radius-surface)] border border-line p-5 md:p-6">
          <h2 className="font-semibold">Order history</h2>
          <ol className="mt-4 space-y-4 border-l border-line pl-5">
            {[...order.timeline].reverse().map((t, i) => (
              <li key={i} className="relative">
                <span className="absolute -left-[25px] top-1.5 size-2 rounded-full bg-leaf" aria-hidden="true" />
                <p className="text-[0.9375rem] font-medium">{t.status === "pending_payment" ? "Order placed" : (STATUS_META[t.status as OrderStatus]?.customer ?? t.status)}</p>
                {t.note && <p className="text-sm text-ink-soft">{t.note}</p>}
                <p className="text-[0.8125rem] text-ink-faint">{formatDateTime(t.at)}</p>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
