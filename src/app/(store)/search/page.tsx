import type { Metadata } from "next";
import { Listing } from "@/components/store/listing";
import { listProducts, parseFilters, searchProducts } from "@/server/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: PageProps<"/search">): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `Search: ${q}` : "Search", robots: { index: false } };
}

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const filters = parseFilters(params);
  let result = await listProducts(filters);

  // The text index matches whole words; fall back to a partial match for things like "mon" or "succ".
  if (filters.q && result.total === 0) {
    const items = await searchProducts(filters.q, 48);
    result = { items, total: items.length, page: 1, pages: 1 };
  }

  return (
    <Listing
      title={filters.q ? `Results for “${filters.q}”` : "Search"}
      crumbs={[{ label: "Home", href: "/" }, { label: "Search" }]}
      result={result}
      basePath="/search"
      params={params}
    />
  );
}
