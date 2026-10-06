"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Check, ShoppingBag, Trash2 } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity";
import { EmptyState } from "@/components/ui/empty-state";
import { refreshCart } from "@/actions/cart";
import { formatINR } from "@/lib/format";
import { cartCount, cartSubtotal, useCart } from "@/stores/cart";
import type { CartLine } from "@/lib/types";

export function FreeShippingMeter({ subtotal, threshold }: { subtotal: number; threshold: number }) {
  if (threshold <= 0) return null;
  const remaining = threshold - subtotal;
  const pct = Math.min(100, Math.round((subtotal / threshold) * 100));
  return (
    <div>
      <p className="text-sm text-ink">
        {remaining > 0 ? (
          <>
            Add <span className="font-semibold font-numeric">{formatINR(remaining)}</span> more for free delivery
          </>
        ) : (
          <span className="inline-flex items-center gap-1.5 font-medium text-leaf-deep">
            <Check className="size-4" strokeWidth={2.5} /> You’ve unlocked free delivery
          </span>
        )}
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-mist" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to free delivery">
        <div className="h-full rounded-full bg-leaf transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** Keeps cart prices/stock honest: refetches from the server whenever `when` becomes true. */
export function useCartRefresh(when: boolean) {
  const lines = useCart((s) => s.lines);
  const reconcile = useCart((s) => s.reconcile);
  const [notice, setNotice] = useState<string | null>(null);
  const ids = lines.map((l) => l.productId).join(",");
  const lastIds = useRef<string>("");

  useEffect(() => {
    if (!when || !ids || lastIds.current === ids) return;
    lastIds.current = ids;
    const before = useCart.getState().lines;
    refreshCart(ids.split(",")).then(({ fresh, missing }) => {
      const changed =
        missing.length > 0 ||
        fresh.some((f) => {
          const b = before.find((l) => l.productId === f.productId);
          return b && (b.price !== f.price || b.quantity > f.maxQty);
        });
      reconcile(fresh, missing);
      if (changed) setNotice("Some prices or stock changed since you added them. Your cart is up to date now.");
    }).catch(() => {});
  }, [when, ids, reconcile]);

  return notice;
}

export function CartLineRow({ line, compact = false }: { line: CartLine; compact?: boolean }) {
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const setOpen = useCart((s) => s.setOpen);
  const soldOut = line.maxQty <= 0;
  return (
    <li className="flex gap-4 py-4">
      <Link
        href={`/plants/${line.slug}`}
        onClick={() => setOpen(false)}
        className={`relative shrink-0 overflow-hidden rounded-lg bg-mist ${compact ? "h-24 w-20" : "h-32 w-26"}`}
      >
        {line.image && <Image src={line.image} alt={line.name} fill sizes="104px" className="object-cover" />}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/plants/${line.slug}`}
            onClick={() => setOpen(false)}
            className="text-[0.9375rem] font-medium leading-snug text-ink hover:text-leaf-deep"
          >
            {line.name}
          </Link>
          <span className="shrink-0 text-[0.9375rem] font-semibold font-numeric">{formatINR(line.price * line.quantity)}</span>
        </div>
        <p className="mt-0.5 text-[0.8125rem] text-ink-soft font-numeric">
          {formatINR(line.price)} each
          {line.compareAtPrice && line.compareAtPrice > line.price && (
            <span className="ml-1.5 text-ink-faint line-through">{formatINR(line.compareAtPrice)}</span>
          )}
        </p>
        {soldOut ? (
          <p className="mt-1 text-[0.8125rem] font-medium text-danger">Sold out — remove to continue</p>
        ) : line.maxQty <= 3 ? (
          <p className="mt-1 text-[0.8125rem] font-medium text-[#8a5a00]">Only {line.maxQty} left</p>
        ) : null}
        <div className="mt-auto flex items-center justify-between pt-3">
          {soldOut ? (
            <span />
          ) : (
            <QuantityStepper size="sm" value={line.quantity} max={Math.min(10, line.maxQty)} onChange={(n) => setQty(line.productId, n)} />
          )}
          <button
            type="button"
            onClick={() => remove(line.productId)}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[0.8125rem] text-ink-soft hover:bg-mist hover:text-danger"
          >
            <Trash2 className="size-3.5" /> Remove
          </button>
        </div>
      </div>
    </li>
  );
}

export function CartDrawer({ freeShippingThreshold }: { freeShippingThreshold: number }) {
  const router = useRouter();
  const { lines, open, setOpen, lastAdded } = useCart();
  const notice = useCartRefresh(open);
  const subtotal = cartSubtotal(lines);
  const count = cartCount(lines);
  const hasSoldOut = lines.some((l) => l.maxQty <= 0);
  const added = lastAdded ? lines.find((l) => l.productId === lastAdded) : null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent
        title={count ? `Your cart (${count})` : "Your cart"}
        description="Items in your cart"
        footer={
          lines.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-baseline justify-between">
                <span className="text-[0.9375rem] text-ink-soft">Subtotal</span>
                <span className="text-lg font-semibold font-numeric">{formatINR(subtotal)}</span>
              </div>
              <p className="-mt-2 text-[0.8125rem] text-ink-soft">Delivery and COD charges are calculated at checkout.</p>
              <Button
                block
                size="lg"
                disabled={hasSoldOut}
                onClick={() => {
                  setOpen(false);
                  router.push("/checkout");
                }}
              >
                Checkout
              </Button>
              <Button variant="secondary" block asChild>
                <Link href="/cart" onClick={() => setOpen(false)}>
                  View cart
                </Link>
              </Button>
            </div>
          )
        }
      >
        {lines.length === 0 ? (
          <EmptyState
            icon={<ShoppingBag className="size-6" strokeWidth={1.6} />}
            title="Your cart is empty"
            action={
              <Button asChild onClick={() => setOpen(false)}>
                <Link href="/plants">Browse plants</Link>
              </Button>
            }
          >
            Find something green for your windowsill, desk or balcony.
          </EmptyState>
        ) : (
          <div className="px-5">
            {added && (
              <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-control)] bg-leaf-tint px-3 py-2.5 text-sm text-leaf-deep animate-pop-in" role="status">
                <Check className="size-4 shrink-0" strokeWidth={2.5} />
                <span className="truncate">
                  <span className="font-semibold">{added.name}</span> added to your cart
                </span>
              </div>
            )}
            {notice && <p className="mt-4 rounded-[var(--radius-control)] bg-marigold-tint px-3 py-2.5 text-sm text-[#6b4500]">{notice}</p>}
            <div className="border-b border-line py-4">
              <FreeShippingMeter subtotal={subtotal} threshold={freeShippingThreshold} />
            </div>
            <ul className="divide-y divide-line">
              {lines.map((l) => (
                <CartLineRow key={l.productId} line={l} compact />
              ))}
            </ul>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
