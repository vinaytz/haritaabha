"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity";
import { formatINR } from "@/lib/format";
import { track } from "@/lib/track";
import type { ProductDetail } from "@/lib/types";
import { MAX_PER_LINE, useCart } from "@/stores/cart";
import { AddToCartButton, useAddToCart } from "./add-to-cart";

export function PurchasePanel({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const addToCart = useAddToCart();
  const [qty, setQty] = useState(1);
  const soldOut = product.stock <= 0;
  const max = Math.min(MAX_PER_LINE, product.stock);
  const ctaRef = useRef<HTMLDivElement>(null);
  const [showSticky, setShowSticky] = useState(false);

  useEffect(() => {
    track.viewItem({ id: product.id, name: product.name, price: product.price, category: product.category.name });
  }, [product.id, product.name, product.price, product.category.name]);

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div ref={ctaRef} className="space-y-3">
        {!soldOut && (
          <div className="flex items-center gap-3">
            <QuantityStepper value={qty} onChange={setQty} max={max} />
            {product.stock <= 5 && <span className="text-sm font-medium text-[#8a5a00]">Only {product.stock} left</span>}
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <AddToCartButton product={product} quantity={qty} size="lg" variant={soldOut ? "secondary" : "primary"} block />
          {!soldOut && (
            <Button
              size="lg"
              variant="dark"
              block
              onClick={() => {
                addToCart(product, qty);
                useCart.getState().setOpen(false); // Buy now skips the drawer
                router.push("/checkout");
              }}
            >
              Buy now
            </Button>
          )}
        </div>
        {soldOut && <p className="text-sm text-ink-soft">This plant is sold out right now. New stock usually arrives within two weeks.</p>}
      </div>

      {/* Sticky buy bar on phones once the main button scrolls away */}
      <div
        className={`fixed inset-x-0 bottom-0 z-20 border-t border-line bg-paper/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 shadow-float backdrop-blur transition-transform duration-200 md:hidden ${
          showSticky ? "translate-y-0" : "translate-y-full"
        }`}
        aria-hidden={!showSticky}
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{product.name}</p>
            <p className="text-[0.9375rem] font-semibold font-numeric">{formatINR(product.price)}</p>
          </div>
          <AddToCartButton product={product} quantity={qty} tabIndex={showSticky ? 0 : -1} />
        </div>
      </div>
    </>
  );
}

