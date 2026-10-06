import { ProductCardSkeleton } from "@/components/store/product-card";

export default function Loading() {
  return (
    <div className="container-page pb-20 pt-7">
      <div className="skeleton h-4 w-40 rounded" />
      <div className="skeleton mt-6 h-11 w-72 rounded" />
      <div className="mt-12 grid gap-10 lg:grid-cols-[240px_1fr]">
        <div className="hidden space-y-3 lg:block">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-5 rounded" />)}</div>
        <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
      </div>
    </div>
  );
}
