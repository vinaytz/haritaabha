"use client";
import { ShoppingBag } from "lucide-react";
import { useHydrated } from "@/lib/use-hydrated";
import { cartCount, useCart } from "@/stores/cart";

export function CartButton() {
  const lines = useCart((s) => s.lines);
  const setOpen = useCart((s) => s.setOpen);
  const mounted = useHydrated();
  const count = mounted ? cartCount(lines) : 0;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="relative grid size-11 place-items-center rounded-full text-ink hover:bg-mist"
      aria-label={count ? `Cart, ${count} items` : "Cart"}
    >
      <ShoppingBag className="size-[22px]" strokeWidth={1.6} />
      {count > 0 && (
        <span className="absolute right-1 top-1 grid min-w-[18px] place-items-center rounded-full bg-leaf px-1 text-[0.6875rem] font-bold leading-[18px] text-white font-numeric">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
