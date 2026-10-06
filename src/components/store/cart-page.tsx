"use client";
import Link from "next/link";
import { useHydrated } from "@/lib/use-hydrated";
import { ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { formatINR } from "@/lib/format";
import { cartCount, cartSubtotal, useCart } from "@/stores/cart";
import { CartLineRow, FreeShippingMeter, useCartRefresh } from "./cart-drawer";

export function CartPageClient({ freeShippingThreshold, shippingFee }: { freeShippingThreshold: number; shippingFee: number }) {
  const lines = useCart((s) => s.lines);
  const mounted = useHydrated();
  const notice = useCartRefresh(mounted);
  if (!mounted) return <div className="container-page py-20"><div className="skeleton h-72 rounded-[var(--radius-surface)]" /></div>;

  const subtotal = cartSubtotal(lines);
  const shipping = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold ? 0 : shippingFee;
  const hasSoldOut = lines.some((l) => l.maxQty <= 0);

  return (
    <div className="container-page pb-20 pt-6 md:pt-10">
      <h1 className="font-display text-[2rem] leading-tight md:text-[2.5rem]">Your cart</h1>
      {lines.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="size-6" strokeWidth={1.6} />}
          title="Your cart is empty"
          action={<Button asChild><Link href="/plants">Browse plants</Link></Button>}
        >
          Find something green for your windowsill, desk or balcony.
        </EmptyState>
      ) : (
        <div className="mt-8 grid items-start gap-8 lg:grid-cols-[1fr_380px] lg:gap-12">
          <div>
            {notice && <p className="mb-4 rounded-[var(--radius-control)] bg-marigold-tint px-4 py-3 text-sm text-[#6b4500]">{notice}</p>}
            <p className="text-ink-soft">{cartCount(lines)} items</p>
            <ul className="mt-2 divide-y divide-line border-y border-line">
              {lines.map((l) => (
                <CartLineRow key={l.productId} line={l} />
              ))}
            </ul>
            <Link href="/plants" className="mt-5 inline-block text-[0.9375rem] font-semibold text-leaf hover:underline">
              Continue shopping
            </Link>
          </div>
          <aside className="rounded-[var(--radius-surface)] border border-line bg-mist/40 p-6 lg:sticky lg:top-32">
            <FreeShippingMeter subtotal={subtotal} threshold={freeShippingThreshold} />
            <dl className="mt-5 space-y-2 border-t border-line pt-4 text-[0.9375rem]">
              <div className="flex justify-between">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd className="font-numeric">{formatINR(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Delivery</dt>
                <dd className="font-numeric">{shipping === 0 ? <span className="font-medium text-leaf-deep">Free</span> : formatINR(shipping)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <dt className="font-semibold">Estimated total</dt>
                <dd className="text-xl font-semibold font-numeric">{formatINR(subtotal + shipping)}</dd>
              </div>
            </dl>
            <Button asChild={!hasSoldOut} size="lg" block className="mt-5" disabled={hasSoldOut}>
              {hasSoldOut ? <span>Remove sold-out items</span> : <Link href="/checkout">Checkout</Link>}
            </Button>
            <p className="mt-3 text-center text-[0.8125rem] text-ink-soft">UPI, cards, net banking or cash on delivery</p>
          </aside>
        </div>
      )}
    </div>
  );
}
