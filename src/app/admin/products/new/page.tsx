import Link from "next/link";
import { listCategoriesAdmin } from "@/server/admin";
import { PageHeader } from "@/components/admin/ui";
import { ProductForm } from "@/components/admin/product-form";

export const metadata = { title: "Add product" };

export default async function NewProductPage() {
  const categories = await listCategoriesAdmin();
  return (
    <>
      <PageHeader back={{ href: "/admin/products", label: "Products" }} title="Add product" />
      {categories.length === 0 ? (
        <p className="rounded-[var(--radius-surface)] border border-line bg-paper p-6 text-sm">
          Create a category first. <Link href="/admin/categories" className="font-semibold text-leaf">Go to categories</Link>
        </p>
      ) : (
        <ProductForm categories={categories} />
      )}
    </>
  );
}
