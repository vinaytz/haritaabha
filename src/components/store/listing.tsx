import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { Sprout } from "lucide-react";
import { Breadcrumbs, type Crumb } from "@/components/ui/breadcrumbs";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import type { ProductCard } from "@/lib/types";
import { ProductGrid } from "./product-card";
import { ActiveFilters, FilterPanel, ListingToolbar } from "./listing-filters";
import { Pagination } from "./pagination";

export function Listing({
  title,
  description,
  crumbs,
  result,
  basePath,
  params,
  aside,
}: {
  title: string;
  description?: ReactNode;
  crumbs: Crumb[];
  result: { items: ProductCard[]; total: number; page: number; pages: number };
  basePath: string;
  params: Record<string, string | string[] | undefined>;
  aside?: ReactNode;
}) {
  return (
    <div className="container-page pb-20 pt-5 md:pt-7">
      <Breadcrumbs items={crumbs} />
      <header className="mb-8 mt-5 max-w-3xl md:mb-10">
        <h1 className="font-display text-[2rem] leading-[1.1] tracking-[-0.015em] md:text-[2.75rem]">{title}</h1>
        {description && <p className="mt-3 text-[0.9375rem] leading-relaxed text-ink-soft md:text-base">{description}</p>}
      </header>
      {aside}
      <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          <div className="sticky top-36">
            <Suspense>
              <FilterPanel />
            </Suspense>
          </div>
        </aside>
        <section aria-label="Products">
          <Suspense>
            <ListingToolbar total={result.total} />
            <ActiveFilters />
          </Suspense>
          {result.items.length ? (
            <>
              <ProductGrid products={result.items} priorityCount={4} className="xl:grid-cols-3 2xl:grid-cols-4" />
              <Pagination page={result.page} pages={result.pages} basePath={basePath} params={params} />
            </>
          ) : (
            <EmptyState
              icon={<Sprout className="size-6" strokeWidth={1.6} />}
              title="No plants match these filters"
              action={
                <Button variant="secondary" asChild>
                  <Link href={basePath}>Clear filters</Link>
                </Button>
              }
            >
              Try removing a filter or two, or browse everything we have.
            </EmptyState>
          )}
        </section>
      </div>
    </div>
  );
}
