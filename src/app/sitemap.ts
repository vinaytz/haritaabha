import type { MetadataRoute } from "next";
import { connectDB } from "@/lib/db";
import { Category, Product } from "@/models";
import { site } from "@/lib/site";
import { POLICIES } from "@/lib/policies";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connectDB();
  const [products, categories] = await Promise.all([
    Product.find({ isActive: true }).select("slug updatedAt images").lean(),
    Category.find({ isActive: true }).select("slug updatedAt").lean(),
  ]);
  const abs = (u: string) => (u.startsWith("http") ? u : `${site.url}${u}`);
  return [
    { url: site.url, changeFrequency: "daily", priority: 1 },
    { url: `${site.url}/plants`, changeFrequency: "daily", priority: 0.9 },
    ...categories.map((c) => ({ url: `${site.url}/category/${c.slug}`, lastModified: c.updatedAt as Date, changeFrequency: "weekly" as const, priority: 0.8 })),
    ...products.map((p) => ({
      url: `${site.url}/plants/${p.slug}`,
      lastModified: p.updatedAt as Date,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      images: p.images?.slice(0, 1).map((i) => abs(i.url)),
    })),
    ...Object.keys(POLICIES).map((k) => ({ url: `${site.url}/${k}`, changeFrequency: "yearly" as const, priority: 0.3 })),
  ];
}
