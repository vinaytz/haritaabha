import Image from "next/image";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { getDashboard } from "@/server/admin";
import { Card, PageHeader, StatusBadge, Table } from "@/components/admin/ui";
import { RevenueChart } from "@/components/admin/revenue-chart";
import { formatDateTime, formatINR } from "@/lib/format";

export const metadata = { title: "Dashboard" };

function Stat({ label, value, sub, href }: { label: string; value: string; sub?: string; href?: string }) {
  const body = (
    <div className="rounded-[var(--radius-surface)] border border-line bg-paper p-5 transition-colors hover:border-line-strong">
      <p className="text-sm text-ink-soft">{label}</p>
      <p className="mt-1 text-[1.75rem] font-semibold tracking-tight font-numeric">{value}</p>
      {sub && <p className="text-[0.8125rem] text-ink-soft">{sub}</p>}
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

export default async function AdminDashboard() {
  const d = await getDashboard();
  const toShip = (d.counts.confirmed ?? 0) + (d.counts.packed ?? 0);
  return (
    <>
      <PageHeader title="Dashboard" description="Last 30 days, confirmed and later orders only." />

      {d.needsAttention > 0 && (
        <Link href="/admin/orders?status=attention" className="mb-6 flex items-center gap-3 rounded-[var(--radius-surface)] border border-danger/30 bg-danger-tint p-4 text-sm text-danger">
          <AlertTriangle className="size-5 shrink-0" />
          <span>
            <span className="font-semibold">{d.needsAttention} order{d.needsAttention > 1 ? "s" : ""} need{d.needsAttention > 1 ? "" : "s"} your attention</span> — on hold,
            a courier problem (failed delivery, return, lost parcel) or a refund still owed.
          </span>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Stat label="Revenue today" value={formatINR(d.revenueToday.total)} sub={`${d.revenueToday.n} orders`} />
        <Stat label="Revenue, 30 days" value={formatINR(d.revenue30.total)} sub={`${d.revenue30.n} orders`} />
        <Stat label="To pack & ship" value={String(toShip)} sub="Confirmed or packed" href="/admin/orders?status=confirmed" />
        <Stat label="In transit" value={String((d.counts.shipped ?? 0) + (d.counts.out_for_delivery ?? 0))} sub="With the courier" href="/admin/orders?status=shipped" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_340px]">
        <Card title="Revenue per day">
          <RevenueChart days={d.days} />
        </Card>
        <Card title="Low stock" actions={<Link href="/admin/products?status=low" className="text-sm font-semibold text-leaf">View all</Link>} padded={false}>
          {d.lowStock.length === 0 ? (
            <p className="p-5 text-sm text-ink-soft">Everything is well stocked.</p>
          ) : (
            <ul className="divide-y divide-line">
              {d.lowStock.map((p) => (
                <li key={p._id}>
                  <Link href={`/admin/products/${p._id}`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-mist/50">
                    <span className="relative size-9 shrink-0 overflow-hidden rounded-md bg-mist">
                      {p.images?.[0]?.url && <Image src={p.images[0].url} alt="" fill sizes="36px" className="object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{p.name}</span>
                    <span className={`text-sm font-semibold font-numeric ${p.stock === 0 ? "text-danger" : "text-[#8a5a00]"}`}>
                      {p.stock === 0 ? "Sold out" : `${p.stock} left`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card title="Recent orders" className="mt-6" padded={false} actions={<Link href="/admin/orders" className="text-sm font-semibold text-leaf">All orders</Link>}>
        {d.recent.length === 0 ? (
          <p className="p-5 text-sm text-ink-soft">No orders yet. They’ll show up here as soon as customers check out.</p>
        ) : (
          <Table>
            <thead><tr><th>Order</th><th>Customer</th><th>Placed</th><th>Payment</th><th>Status</th><th className="text-right">Total</th></tr></thead>
            <tbody>
              {d.recent.map((o) => (
                <tr key={o._id} className="hover:bg-mist/40">
                  <td><Link href={`/admin/orders/${o._id}`} className="font-semibold text-leaf hover:underline">{o.orderNumber}</Link></td>
                  <td>{o.address.name}</td>
                  <td className="text-ink-soft">{formatDateTime(o.createdAt)}</td>
                  <td className="text-ink-soft">{o.payment.method === "cod" ? "COD" : "Online"}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="text-right font-medium font-numeric">{formatINR(o.amounts.total)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}
