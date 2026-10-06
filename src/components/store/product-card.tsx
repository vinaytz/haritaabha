import Image from "next/image";
import Link from "next/link";
import { PawPrint } from "lucide-react";
import { Price } from "@/components/ui/price";
import { LightScale } from "@/components/ui/light-scale";
import { discountPercent } from "@/lib/format";
import { CARE_META } from "@/lib/plant-care";
import type { ProductCard as Card } from "@/lib/types";
import { cn } from "@/lib/utils";
import { QuickAdd } from "./add-to-cart";

export function ProductCard({ product, priority = false, className }: { product: Card; priority?: boolean; className?: string }) {
  const off = discountPercent(product.price, product.compareAtPrice);
  const soldOut = product.stock <= 0;
  const lowStock = !soldOut && product.stock <= 5;

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <Link href={`/plants/${product.slug}`} className="relative block aspect-[4/5] overflow-hidden rounded-[var(--radius-surface)] bg-mist">
        {product.image ? (
          <>
            <Image
              src={product.image}
              alt={product.name}
              fill
              priority={priority}
              sizes="(min-width: 1280px) 300px, (min-width: 768px) 30vw, 48vw"
              className={cn(
                "object-cover transition duration-500 ease-out",
                product.hoverImage && "group-hover:opacity-0",
                soldOut && "opacity-70 saturate-[.6]",
              )}
            />
            {product.hoverImage && (
              <Image
                src={product.hoverImage}
                alt=""
                fill
                sizes="(min-width: 1280px) 300px, (min-width: 768px) 30vw, 48vw"
                className="object-cover opacity-0 transition duration-500 ease-out group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="grid h-full place-items-center text-sm text-ink-faint">No photo yet</div>
        )}
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {soldOut ? (
            <span className="rounded-full bg-paper/95 px-2.5 py-0.5 text-xs font-semibold leading-5 text-ink">Sold out</span>
          ) : off >= 5 ? (
            <span className="rounded-full bg-marigold px-2.5 py-0.5 text-xs font-bold leading-5 text-ink">{off}% off</span>
          ) : null}
        </div>
        {product.petSafe && (
          <span
            className="absolute right-2.5 top-2.5 grid size-7 place-items-center rounded-full bg-paper/95 text-leaf"
            title="Safe for cats and dogs"
          >
            <PawPrint className="size-3.5" strokeWidth={2} />
            <span className="sr-only">Pet-safe</span>
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col pt-3">
        <h3 className="text-[0.9375rem] font-medium leading-snug text-ink">
          <Link href={`/plants/${product.slug}`} className="hover:text-leaf-deep">
            {product.name}
          </Link>
        </h3>
        {product.botanicalName && (
          <p className="mt-0.5 truncate text-[0.8125rem] italic text-ink-soft">{product.botanicalName}</p>
        )}
        {(product.light || product.level) && (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <LightScale level={product.light} />
            {product.level === "easy" && <span className="text-xs text-ink-soft">{CARE_META.easy.label}</span>}
          </div>
        )}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <div>
            <Price price={product.price} compareAt={product.compareAtPrice} size="sm" />
            {lowStock && <p className="mt-0.5 text-xs font-medium text-[#8a5a00]">Only {product.stock} left</p>}
          </div>
          <QuickAdd product={product} className="shrink-0" />
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0, className }: { products: Card[]; priorityCount?: number; className?: string }) {
  return (
    <div className={cn("grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-5 md:grid-cols-3 xl:grid-cols-4", className)}>
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div>
      <div className="skeleton aspect-[4/5] rounded-[var(--radius-surface)]" />
      <div className="skeleton mt-3 h-4 w-3/4 rounded" />
      <div className="skeleton mt-2 h-3 w-1/2 rounded" />
      <div className="skeleton mt-4 h-4 w-1/3 rounded" />
    </div>
  );
}
