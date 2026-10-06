import "server-only";
import { cache } from "react";
import { Types, type QueryFilter } from "mongoose";
import { connectDB } from "@/lib/db";
import { Category, Product, type ProductDoc } from "@/models";
import type { CategoryLite, ProductCard, ProductDetail } from "@/lib/types";
import { CARE_LEVELS, LIGHT_LEVELS, type CareLevel, type LightLevel } from "@/lib/plant-care";

type LeanProduct = ProductDoc & { category: unknown };

export function toCard(p: LeanProduct, categorySlug?: string): ProductCard {
  return {
    id: String(p._id),
    name: p.name,
    slug: p.slug,
    botanicalName: p.botanicalName ?? "",
    image: p.images?.[0]?.url ?? null,
    hoverImage: p.images?.[1]?.url ?? null,
    price: p.price,
    compareAtPrice: p.compareAtPrice ?? null,
    stock: p.stock,
    light: (p.care?.light as LightLevel) ?? null,
    level: (p.care?.level as CareLevel) ?? null,
    petSafe: p.care?.petSafe ?? null,
    categorySlug,
  };
}

const CARD_FIELDS = "name slug botanicalName images price compareAtPrice stock care category";

export const getCategories = cache(async (): Promise<CategoryLite[]> => {
  await connectDB();
  const [cats, counts] = await Promise.all([
    Category.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    Product.aggregate<{ _id: Types.ObjectId; n: number }>([
      { $match: { isActive: true } },
      { $group: { _id: "$category", n: { $sum: 1 } } },
    ]),
  ]);
  const byId = new Map(counts.map((c) => [String(c._id), c.n]));
  return cats.map((c) => ({
    id: String(c._id),
    name: c.name,
    slug: c.slug,
    description: c.description ?? "",
    image: c.image?.url ?? null,
    productCount: byId.get(String(c._id)) ?? 0,
  }));
});

export async function getCategoryBySlug(slug: string) {
  const cats = await getCategories();
  return cats.find((c) => c.slug === slug) ?? null;
}

export const SORTS = {
  popular: { label: "Most popular", sort: { salesCount: -1, createdAt: -1 } },
  newest: { label: "Newest", sort: { createdAt: -1 } },
  "price-asc": { label: "Price: low to high", sort: { price: 1 } },
  "price-desc": { label: "Price: high to low", sort: { price: -1 } },
} as const;
export type SortKey = keyof typeof SORTS;

export const PRICE_BANDS = {
  "under-300": { label: "Under ₹300", min: 0, max: 29999 },
  "300-600": { label: "₹300 – ₹600", min: 30000, max: 60000 },
  "600-1200": { label: "₹600 – ₹1,200", min: 60001, max: 120000 },
  "over-1200": { label: "Over ₹1,200", min: 120001, max: Number.MAX_SAFE_INTEGER },
} as const;
export type PriceBand = keyof typeof PRICE_BANDS;

export type ListingFilters = {
  category?: string;
  light?: LightLevel[];
  level?: CareLevel[];
  petSafe?: boolean;
  inStock?: boolean;
  onSale?: boolean;
  featured?: boolean;
  price?: PriceBand[];
  q?: string;
  tag?: string;
  sort?: SortKey;
  page?: number;
};

const PAGE_SIZE = 24;

function list(v: string | string[] | undefined): string[] {
  if (!v) return [];
  return (Array.isArray(v) ? v : v.split(",")).map((s) => s.trim()).filter(Boolean);
}

/** Parse URL search params into validated filters (unknown values are dropped). */
export function parseFilters(sp: Record<string, string | string[] | undefined>): ListingFilters {
  const one = (k: string) => (Array.isArray(sp[k]) ? sp[k]![0] : (sp[k] as string | undefined));
  const sort = one("sort");
  const page = Number(one("page"));
  return {
    light: list(sp.light).filter((l): l is LightLevel => (LIGHT_LEVELS as readonly string[]).includes(l)),
    level: list(sp.level).filter((l): l is CareLevel => (CARE_LEVELS as readonly string[]).includes(l)),
    price: list(sp.price).filter((p): p is PriceBand => p in PRICE_BANDS),
    petSafe: one("pet") === "1" || undefined,
    inStock: one("stock") === "1" || undefined,
    onSale: one("sale") === "1" || undefined,
    featured: one("featured") === "1" || undefined,
    q: one("q")?.slice(0, 80) || undefined,
    tag: one("tag")?.slice(0, 40) || undefined,
    sort: sort && sort in SORTS ? (sort as SortKey) : undefined,
    page: Number.isFinite(page) && page > 1 ? Math.floor(page) : 1,
  };
}

export async function listProducts(filters: ListingFilters) {
  await connectDB();
  const query: QueryFilter<ProductDoc> = { isActive: true };

  if (filters.category) {
    const cat = await getCategoryBySlug(filters.category);
    if (!cat) return { items: [], total: 0, page: 1, pages: 0 };
    query.category = new Types.ObjectId(cat.id);
  }
  if (filters.light?.length) query["care.light"] = { $in: filters.light };
  if (filters.level?.length) query["care.level"] = { $in: filters.level };
  if (filters.petSafe) query["care.petSafe"] = true;
  if (filters.inStock) query.stock = { $gt: 0 };
  if (filters.tag) query.tags = filters.tag;
  if (filters.featured) query.isFeatured = true;
  if (filters.onSale) query.$expr = { $gt: ["$compareAtPrice", "$price"] };
  if (filters.price?.length) {
    query.$or = filters.price.map((b) => ({ price: { $gte: PRICE_BANDS[b].min, $lte: PRICE_BANDS[b].max } }));
  }
  if (filters.q) query.$text = { $search: filters.q };

  const sortSpec = filters.q && !filters.sort ? { score: { $meta: "textScore" as const } } : SORTS[filters.sort ?? "popular"].sort;
  const page = filters.page ?? 1;

  const [docs, total] = await Promise.all([
    Product.find(query, filters.q ? { score: { $meta: "textScore" } } : undefined)
      .select(CARD_FIELDS)
      .sort(sortSpec as Record<string, 1 | -1>)
      .skip((page - 1) * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .lean<LeanProduct[]>(),
    Product.countDocuments(query),
  ]);

  // Push sold-out items to the end of the page without breaking the sort within each group.
  const items = docs.map((d) => toCard(d));
  items.sort((a, b) => Number(b.stock > 0) - Number(a.stock > 0));

  return { items, total, page, pages: Math.ceil(total / PAGE_SIZE) };
}

/** Regex fallback for short/partial queries the text index misses (e.g. "mon"). */
export async function searchProducts(q: string, limit = 8): Promise<ProductCard[]> {
  await connectDB();
  const term = q.trim().slice(0, 60);
  if (!term) return [];
  const rx = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const docs = await Product.find({ isActive: true, $or: [{ name: rx }, { botanicalName: rx }, { tags: rx }] })
    .select(CARD_FIELDS)
    .sort({ salesCount: -1 })
    .limit(limit)
    .lean<LeanProduct[]>();
  return docs.map((d) => toCard(d));
}

export async function getProductCards(
  query: QueryFilter<ProductDoc>,
  opts: { limit?: number; sort?: Record<string, 1 | -1> } = {},
): Promise<ProductCard[]> {
  await connectDB();
  const docs = await Product.find({ isActive: true, ...query })
    .select(CARD_FIELDS)
    .sort(opts.sort ?? { salesCount: -1 })
    .limit(opts.limit ?? 8)
    .lean<LeanProduct[]>();
  return docs.map((d) => toCard(d));
}

export const getProductBySlug = cache(async (slug: string): Promise<ProductDetail | null> => {
  await connectDB();
  const p = await Product.findOne({ slug, isActive: true })
    .populate<{ category: { name: string; slug: string } }>("category", "name slug")
    .lean();
  if (!p) return null;
  const card = toCard(p as unknown as LeanProduct, p.category?.slug);
  return {
    ...card,
    shortDescription: p.shortDescription ?? "",
    description: p.description ?? "",
    images: (p.images ?? []).map((i) => ({ url: i.url, alt: i.alt || p.name })),
    sku: p.sku ?? "",
    category: { name: p.category?.name ?? "", slug: p.category?.slug ?? "" },
    care: {
      light: (p.care?.light as LightLevel) ?? null,
      water: (p.care?.water as ProductDetail["care"]["water"]) ?? null,
      level: (p.care?.level as CareLevel) ?? null,
      petSafe: p.care?.petSafe ?? null,
      airPurifying: Boolean(p.care?.airPurifying),
      notes: p.care?.notes ?? "",
    },
    size: {
      heightCm: p.size?.heightCm ?? null,
      potSizeIn: p.size?.potSizeIn ?? null,
      potIncluded: p.size?.potIncluded ?? true,
      label: p.size?.label ?? "",
    },
    tags: p.tags ?? [],
    weightKg: p.shipping?.weightKg ?? 1,
  };
});

export async function getRelatedProducts(product: ProductDetail, limit = 4) {
  await connectDB();
  const cat = await Category.findOne({ slug: product.category.slug }).select("_id").lean();
  const sameCategory = cat
    ? await getProductCards({ category: cat._id, _id: { $ne: new Types.ObjectId(product.id) }, stock: { $gt: 0 } }, { limit })
    : [];
  if (sameCategory.length >= limit || !product.light) return sameCategory.slice(0, limit);
  const more = await getProductCards(
    {
      "care.light": product.light,
      _id: { $nin: [product.id, ...sameCategory.map((p) => p.id)].map((id) => new Types.ObjectId(id)) },
      stock: { $gt: 0 },
    },
    { limit: limit - sameCategory.length },
  );
  return [...sameCategory, ...more];
}

export async function getLightCounts(): Promise<Record<string, number>> {
  await connectDB();
  const rows = await Product.aggregate<{ _id: string; n: number }>([
    { $match: { isActive: true, "care.light": { $ne: null } } },
    { $group: { _id: "$care.light", n: { $sum: 1 } } },
  ]);
  return Object.fromEntries(rows.map((r) => [r._id, r.n]));
}
