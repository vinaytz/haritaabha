import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Package } from "lucide-react";
import { requireUser } from "@/lib/session";
import { getUserOrders } from "@/server/account";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate, formatINR, plural } from "@/lib/format";
import { STATUS_META } from "@/lib/order-status";
import type { OrderStatus } from "@/models/Order";

export const metadata: Metadata = { title: "Your orders" };

export default async function OrdersPage() {
  const session = await requireUser("/account/orders");
  const orders = await getUserOrders(session.user.id);
  return (
    <>
      <h1 className="font-display text-[2rem] leading-tight">Orders</h1>
      {orders.length === 0 ? (
        <EmptyState
          icon={<Package className="size-6" strokeWidth={1.6} />}
          title="No orders yet"
          action={<Button asChild><Link href="/plants">Start shopping</Link></Button>}
        >
          When you place an order, you’ll be able to track it here.
        </EmptyState>
      ) : (
        <ul className="mt-6 space-y-4">
          {orders.map((o) => {
            const meta = STATUS_META[o.status as OrderStatus];
            const count = o.items.reduce((n, i) => n + i.quantity, 0);
            return (
              <li key={String(o._id)}>
                <Link
                  href={`/account/orders/${o._id}`}
                  className="block rounded-[var(--radius-surface)] border border-line p-4 transition-colors hover:border-line-strong md:p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">Order {o.orderNumber}</p>
                      <p className="text-sm text-ink-soft">
                        {formatDate(o.createdAt)} · {plural(count, "item")} · <span className="font-numeric">{formatINR(o.amounts.total)}</span>
                      </p>
                    </div>
                    <Badge tone={meta.tone}>{meta.customer}</Badge>
                  </div>
                  <div className="mt-4 flex gap-2">
                    {o.items.slice(0, 5).map((i) => (
                      <span key={i.slug} className="relative size-14 overflow-hidden rounded-md bg-mist">
                        {i.image && <Image src={i.image} alt={i.name} fill sizes="56px" className="object-cover" />}
                      </span>
                    ))}
                    {o.items.length > 5 && (
                      <span className="grid size-14 place-items-center rounded-md bg-mist text-sm text-ink-soft">+{o.items.length - 5}</span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
