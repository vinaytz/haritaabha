"use client";
import { Plus, ShoppingBag } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useCart } from "@/stores/cart";
import { track } from "@/lib/track";
import type { ProductCard } from "@/lib/types";
import { cn } from "@/lib/utils";

type Addable = Pick<ProductCard, "id" | "slug" | "name" | "image" | "price" | "compareAtPrice" | "stock">;

export function useAddToCart() {
  const add = useCart((s) => s.add);
  return (p: Addable, qty = 1) => {
    add(
      { productId: p.id, slug: p.slug, name: p.name, image: p.image, price: p.price, compareAtPrice: p.compareAtPrice, maxQty: p.stock },
      qty,
    );
    track.addToCart({ id: p.id, name: p.name, price: p.price, quantity: qty });
  };
}

/** Compact add button used on product cards. */
export function QuickAdd({ product, className }: { product: Addable; className?: string }) {
  const addToCart = useAddToCart();
  if (product.stock <= 0) return null;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        addToCart(product);
      }}
      className={cn(
        "grid size-10 place-items-center rounded-full border border-line-strong bg-paper text-ink transition-colors hover:border-leaf hover:bg-leaf hover:text-white",
        className,
      )}
      aria-label={`Add ${product.name} to cart`}
    >
      <Plus className="size-[18px]" strokeWidth={2} />
    </button>
  );
}

export function AddToCartButton({
  product,
  quantity = 1,
  children,
  ...props
}: { product: Addable; quantity?: number } & Omit<ButtonProps, "onClick">) {
  const addToCart = useAddToCart();
  const soldOut = product.stock <= 0;
  return (
    <Button {...props} disabled={soldOut || props.disabled} onClick={() => addToCart(product, quantity)}>
      {children ?? (
        <>
          <ShoppingBag className="size-[18px]" strokeWidth={1.8} />
          {soldOut ? "Sold out" : "Add to cart"}
        </>
      )}
    </Button>
  );
}
