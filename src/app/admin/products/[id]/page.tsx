import { notFound } from "next/navigation";
import { getProductAdmin, listCategoriesAdmin } from "@/server/admin";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: PageProps<"/admin/products/[id]">) {
  const { id } = await params;
  const [p, categories] = await Promise.all([getProductAdmin(id), listCategoriesAdmin()]);
  if (!p) notFound();
  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: "Products" }} title={p.name} />
      <ProductForm
        id={p._id}
        categories={categories}
        initial={{
          name: p.name,
          slug: p.slug,
          botanicalName: p.botanicalName ?? "",
          category: String(p.category),
          shortDescription: p.shortDescription ?? "",
          description: p.description ?? "",
          images: (p.images ?? []).map((i) => ({ url: i.url, fileId: i.fileId ?? "", alt: i.alt ?? "" })),
          price: p.price / 100,
          compareAtPrice: p.compareAtPrice ? p.compareAtPrice / 100 : null,
          stock: p.stock,
          sku: p.sku ?? "",
          care: {
            light: p.care?.light ?? null,
            water: p.care?.water ?? null,
            level: p.care?.level ?? null,
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
          shipping: {
            weightKg: p.shipping?.weightKg ?? 1,
            lengthCm: p.shipping?.lengthCm ?? 20,
            breadthCm: p.shipping?.breadthCm ?? 20,
            heightCm: p.shipping?.heightCm ?? 30,
          },
          tags: (p.tags ?? []).join(", "),
          isFeatured: Boolean(p.isFeatured),
          isActive: p.isActive !== false,
        }}
      />
    </>
  );
}
