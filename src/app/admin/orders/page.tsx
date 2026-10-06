import Link from "next/link";
import { listOrders } from "@/server/admin";
import { AdminPagination, Card, PageHeader, SearchForm, StatusBadge, Table } from "@/components/admin/ui";
import { formatDateTime, formatINR } from "@/lib/format";
import { STATUS_META } from "@/lib/order-status";
import { cn } from "@/lib/utils";
import type { OrderStatus } from "@/models/Order";

export const metadata = { title: "Orders" };

const TABS: { key: string; label: string }[] = [
  { key: "", label: "All" },
  { key: "attention", label: "Needs attention" },
  { key: "confirmed", label: "To pack" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for delivery" },
  { key: "delivered", label: "Delivered" },
  { key: "on_hold", label: "On hold" },
  { key: "pending_payment", label: "Awaiting payment" },
  { key: "cancelled", label: "Cancelled" },
];

export default async function AdminOrders({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "";
  const q = typeof sp.q === "string" ? sp.q : "";
  const page = Number(sp.page) || 1;
  const data = await listOrders({ status, q, page });
  const href = (p: Record<string, string | number | undefined>) => {
    const u = new URLSearchParams();
    const merged = { status, q, ...p };
    for (const [k, v] of Object.entries(merged)) if (v) u.set(k, String(v));
    const s = u.toString();
    return s ? `/admin/orders?${s}` : "/admin/orders";
  };

  return (
    <>
      <PageHeader title="Orders" description={`${data.total} ${data.total === 1 ? "order" : "orders"}`} actions={<SearchForm placeholder="Order no., name, phone, AWB" defaultValue={q} hidden={{ status }} />} />
      <div className="-mx-4 mb-4 flex gap-1 overflow-x-auto px-4 scrollbar-none md:mx-0 md:px-0">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={href({ status: t.key, page: undefined })}
            className={cn(
              "whitespace-nowrap rounded-full px-3 py-1.5 text-sm",
              status === t.key ? "bg-ink font-semibold text-white" : "text-ink-soft hover:bg-paper hover:text-ink",
            )}
          >
            {t.label}
            {t.key && data.counts[t.key] ? <span className="ml-1.5 opacity-70 font-numeric">{data.counts[t.key]}</span> : null}
          </Link>
        ))}
      </div>
      <Card padded={false}>
        {data.items.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-soft">
            {q ? `No orders match “${q}”.` : status === "attention" ? "Nothing needs your attention right now." : status ? `No ${STATUS_META[status as OrderStatus]?.label.toLowerCase() ?? ""} orders.` : "No orders yet."}
          </p>
        ) : (
          <Table>
            <thead>
              <tr><th>Order</th><th>Customer</th><th>Placed</th><th>Items</th><th>Payment</th><th>Status</th><th className="text-right">Total</th></tr>
            </thead>
            <tbody>
              {data.items.map((o) => (
                <tr key={o._id} className="hover:bg-mist/40">
                  <td>
                    <Link href={`/admin/orders/${o._id}`} className="font-semibold text-leaf hover:underline">{o.orderNumber}</Link>
                  </td>
                  <td>
                    <p>{o.address.name}</p>
                    <p className="text-[0.8125rem] text-ink-soft">{o.address.city} {o.address.pincode}</p>
                  </td>
                  <td className="whitespace-nowrap text-ink-soft">{formatDateTime(o.createdAt)}</td>
                  <td className="font-numeric">{o.items.reduce((n, i) => n + i.quantity, 0)}</td>
                  <td className="text-ink-soft">
                    {o.payment.method === "cod" ? "COD" : "Online"}
                    {o.payment.status === "refunded" && <span className="text-danger"> · refunded</span>}
                    {o.payment.status === "paid" && ["cancelled", "returned"].includes(o.status) && <span className="text-danger"> · refund due</span>}
                  </td>
                  <td>
                    <StatusBadge status={o.status} />
                    {o.shipment?.issue && <p className="mt-1 text-[0.8125rem] text-danger">Courier issue</p>}
                  </td>
                  <td className="text-right font-medium font-numeric">{formatINR(o.amounts.total)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <AdminPagination page={data.page} pages={data.pages} href={(p) => href({ page: p })} />
      </Card>
    </>
  );
}
