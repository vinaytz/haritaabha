import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderAdmin } from "@/server/admin";
import { Card, PageHeader, StatusBadge } from "@/components/admin/ui";
import { AddressBlock } from "@/components/store/address-form";
import { OrderAdminActions, AdminNote } from "@/components/admin/order-actions";
import { formatDateTime, formatINR, formatShortDate } from "@/lib/format";
import { PAYMENT_LABEL, STATUS_META } from "@/lib/order-status";
import { shippingMocked } from "@/lib/env";
import type { OrderStatus } from "@/models/Order";

export const metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  const o = await getOrderAdmin(id);
  if (!o) notFound();

  return (
    <>
      <PageHeader
        back={{ href: "/admin/orders", label: "Orders" }}
        title={`Order ${o.orderNumber}`}
        description={`Placed ${formatDateTime(o.createdAt)} by ${o.email}`}
        actions={<StatusBadge status={o.status} />}
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <OrderAdminActions
            orderId={o._id}
            status={o.status as OrderStatus}
            paymentMethod={o.payment.method}
            paymentStatus={o.payment.status}
            hasShipment={Boolean(o.shipment?.awb)}
            shippingMocked={shippingMocked}
            issue={o.shipment?.issue || undefined}
          />

          <Card title="Items" padded={false}>
            <ul className="divide-y divide-line">
              {o.items.map((i) => (
                <li key={i.slug} className="flex items-center gap-4 px-5 py-3">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-md bg-mist">
                    {i.image && <Image src={i.image} alt="" fill sizes="56px" className="object-cover" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/plants/${i.slug}`} target="_blank" className="font-medium hover:underline">{i.name}</Link>
                    <p className="text-[0.8125rem] text-ink-soft">SKU {i.sku || "—"}</p>
                  </div>
                  <p className="text-sm text-ink-soft font-numeric">{i.quantity} × {formatINR(i.price)}</p>
                  <p className="w-20 text-right font-medium font-numeric">{formatINR(i.price * i.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="space-y-1.5 border-t border-line px-5 py-4 text-sm">
              <div className="flex justify-between"><dt className="text-ink-soft">Subtotal</dt><dd className="font-numeric">{formatINR(o.amounts.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-ink-soft">Delivery</dt><dd className="font-numeric">{formatINR(o.amounts.shipping)}</dd></div>
              {o.amounts.codFee > 0 && <div className="flex justify-between"><dt className="text-ink-soft">COD fee</dt><dd className="font-numeric">{formatINR(o.amounts.codFee)}</dd></div>}
              <div className="flex justify-between border-t border-line pt-2 text-base font-semibold"><dt>Total</dt><dd className="font-numeric">{formatINR(o.amounts.total)}</dd></div>
            </dl>
          </Card>

          <Card title="Timeline">
            <ol className="space-y-4 border-l border-line pl-5">
              {[...o.timeline].reverse().map((t, i) => (
                <li key={i} className="relative">
                  <span className="absolute -left-[25px] top-1.5 size-2 rounded-full bg-leaf" aria-hidden="true" />
                  <p className="text-sm font-medium">{t.status === "pending_payment" ? "Order placed" : STATUS_META[t.status as OrderStatus]?.label ?? t.status}</p>
                  {t.note && <p className="text-sm text-ink-soft">{t.note}</p>}
                  <p className="text-[0.8125rem] text-ink-faint">{formatDateTime(t.at)} · {t.by}</p>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-6">
          <Card title="Customer">
            <AddressBlock a={o.address} />
            <p className="mt-2 text-sm text-ink-soft">{o.email}</p>
            {o.customerNote && (
              <div className="mt-4 rounded-md bg-marigold-tint p-3 text-sm">
                <p className="font-semibold">Note from customer</p>
                <p className="mt-0.5">{o.customerNote}</p>
              </div>
            )}
          </Card>
          <Card title="Payment">
            <p className="text-sm">{PAYMENT_LABEL[o.payment.status] ?? o.payment.status}{o.payment.mock ? " (test)" : ""}</p>
            {o.payment.razorpayPaymentId && <p className="mt-1 break-all text-[0.8125rem] text-ink-soft">Razorpay {o.payment.razorpayPaymentId}</p>}
            {o.payment.paidAt && <p className="text-[0.8125rem] text-ink-soft">Paid {formatDateTime(o.payment.paidAt)}</p>}
          </Card>
          <Card title="Shipment">
            {o.shipment?.awb ? (
              <dl className="space-y-2 text-sm">
                <div><dt className="text-ink-soft">Courier</dt><dd className="font-medium">{o.shipment.courier || "—"}{o.shipment.provider === "mock" && " (demo)"}</dd></div>
                <div><dt className="text-ink-soft">AWB</dt><dd className="font-medium font-numeric">{o.shipment.awb}</dd></div>
                {o.shipment.cost != null && (
                  <div>
                    <dt className="text-ink-soft">Courier charge (estimate)</dt>
                    <dd className="font-numeric">
                      {formatINR(o.shipment.cost)}
                      <span className="text-ink-soft"> · customer paid {formatINR(o.amounts.shipping + o.amounts.codFee)} for delivery</span>
                    </dd>
                  </div>
                )}
                {o.shipment.etd && <div><dt className="text-ink-soft">Expected</dt><dd>{formatShortDate(o.shipment.etd)}</dd></div>}
                {o.shipment.lastEvent && <div><dt className="text-ink-soft">Latest update</dt><dd>{o.shipment.lastEvent}{o.shipment.lastEventAt && <span className="text-ink-soft"> · {formatDateTime(o.shipment.lastEventAt)}</span>}</dd></div>}
                <div className="flex flex-wrap gap-3 pt-1">
                  {o.shipment.labelUrl && <a href={o.shipment.labelUrl} target="_blank" rel="noreferrer" className="font-semibold text-leaf hover:underline">Print label</a>}
                  {o.shipment.trackingUrl && <a href={o.shipment.trackingUrl} target="_blank" rel="noreferrer" className="font-semibold text-leaf hover:underline">Tracking page</a>}
                </div>
              </dl>
            ) : (
              <p className="text-sm text-ink-soft">Not shipped yet. Use “Ship with Shiprocket” once the order is packed.</p>
            )}
          </Card>
          <Card title="Internal note">
            <AdminNote orderId={o._id} initial={o.adminNote ?? ""} />
          </Card>
        </div>
      </div>
    </>
  );
}
