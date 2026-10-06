import type { Metadata } from "next";
import { Listing } from "@/components/store/listing";
import { listProducts, parseFilters } from "@/server/catalog";
import { LIGHT_META, type LightLevel } from "@/lib/plant-care";

export const dynamic = "force-dynamic";

export async function generateMetadata({ searchParams }: PageProps<"/plants">): Promise<Metadata> {
  const sp = await searchParams;
  const light = typeof sp.light === "string" && sp.light in LIGHT_META ? LIGHT_META[sp.light as LightLevel].label : null;
  return {
    title: light ? `Plants for ${light.toLowerCase()}` : "All plants",
    description: "Shop indoor, flowering, succulent, herb and bonsai plants online, with delivery across India.",
    alternates: { canonical: "/plants" },
  };
}

export default async function PlantsPage({ searchParams }: PageProps<"/plants">) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const result = await listProducts(filters);
  const onlyLight = filters.light?.length === 1 ? LIGHT_META[filters.light[0]] : null;

  return (
    <Listing
      title={onlyLight ? `Plants for ${onlyLight.label.toLowerCase()}` : filters.onSale ? "Offers" : filters.featured ? "Our picks" : "All plants"}
      description={
        onlyLight
          ? `${onlyLight.hint}. These plants are happiest in that kind of spot.`
          : "Everything we grow and sell. Filter by the light you have, how much care you want to give, or whether it needs to be safe for pets."
      }
      crumbs={[{ label: "Home", href: "/" }, { label: "All plants" }]}
      result={result}
      basePath="/plants"
      params={params}
    />
  );
}
