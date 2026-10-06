import { listCategoriesAdmin } from "@/server/admin";
import { PageHeader } from "@/components/admin/ui";
import { CategoryManager } from "@/components/admin/category-manager";

export const metadata = { title: "Categories" };

export default async function AdminCategories() {
  const categories = await listCategoriesAdmin();
  return (
    <>
      <PageHeader title="Categories" description="Shown in the store navigation in this order." />
      <CategoryManager categories={categories} />
    </>
  );
}
