import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Listing } from "@/components/store/listing";
import { getCategoryBySlug, listProducts, parseFilters } from "@/server/catalog";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/category/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const cat = await getCategoryBySlug(slug);
  if (!cat) return {};
  return {
    title: `${cat.name} — buy online`,
    description: cat.description || `Shop ${cat.name.toLowerCase()} online with delivery across India.`,
    alternates: { canonical: `/category/${cat.slug}` },
    openGraph: cat.image ? { images: [cat.image] } : undefined,
  };
}

export default async function CategoryPage({ params, searchParams }: PageProps<"/category/[slug]">) {
  const [{ slug }, sp] = await Promise.all([params, searchParams]);
  const cat = await getCategoryBySlug(slug);
  if (!cat) notFound();
  const result = await listProducts({ ...parseFilters(sp), category: slug });

  return (
    <Listing
      title={cat.name}
      description={cat.description}
      crumbs={[{ label: "Home", href: "/" }, { label: "All plants", href: "/plants" }, { label: cat.name }]}
      result={result}
      basePath={`/category/${cat.slug}`}
      params={sp}
    />
  );
}
