import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { listCategoriesAdmin, listProductsAdmin } from "@/server/admin";
import { AdminPagination, Card, PageHeader, SearchForm, Table } from "@/components/admin/ui";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductRowToggle } from "@/components/admin/product-row";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Products" };

const FILTERS = [
  { key: "", label: "All" },
  { key: "active", label: "Visible" },
  { key: "hidden", label: "Hidden" },
  { key: "low", label: "Low stock" },
  { key: "out", label: "Sold out" },
];

export default async function AdminProducts({ searchParams }: PageProps<"/admin/products">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const category = typeof sp.category === "string" ? sp.category : "";
  const page = Number(sp.page) || 1;
  const [data, categories] = await Promise.all([listProductsAdmin({ q, status, category, page }), listCategoriesAdmin()]);
  const href = (p: Record<string, string | number | undefined>) => {
    const u = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, status, category, ...p })) if (v) u.set(k, String(v));
    const s = u.toString();
    return s ? `/admin/products?${s}` : "/admin/products";
  };

  return (
    <>
      <PageHeader
        title="Products"
        description={`${data.total} ${data.total === 1 ? "product" : "products"}`}
        actions={
          <Button asChild>
            <Link href="/admin/products/new"><Plus className="size-4" /> Add product</Link>
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <SearchForm placeholder="Search name or SKU" defaultValue={q} hidden={{ status, category }} />
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <Link key={f.key} href={href({ status: f.key, page: undefined })} className={cn("rounded-full px-3 py-1.5 text-sm", status === f.key ? "bg-ink font-semibold text-white" : "text-ink-soft hover:bg-paper hover:text-ink")}>
              {f.label}
            </Link>
          ))}
        </div>
        <form className="ml-auto">
          {q && <input type="hidden" name="q" value={q} />}
          {status && <input type="hidden" name="status" value={status} />}
          <select name="category" defaultValue={category} className="h-10 rounded-[var(--radius-control)] border border-line-strong bg-paper px-3 text-sm" aria-label="Filter by category">
            <option value="">All categories</option>
            {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
          </select>
          <button className="ml-2 h-10 rounded-[var(--radius-control)] border border-line-strong bg-paper px-3 text-sm hover:bg-mist">Apply</button>
        </form>
      </div>
      <Card padded={false}>
        {data.items.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-semibold">No products found</p>
            <p className="mt-1 text-sm text-ink-soft">{q || status || category ? "Try a different search or filter." : "Add your first plant to start selling."}</p>
          </div>
        ) : (
          <Table>
            <thead><tr><th>Product</th><th>Category</th><th className="text-right">Price</th><th className="text-right">Stock</th><th>Visible</th><th /></tr></thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p._id} className="hover:bg-mist/40">
                  <td>
                    <Link href={`/admin/products/${p._id}`} className="flex items-center gap-3">
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-mist">
                        {p.images?.[0]?.url && <Image src={p.images[0].url} alt="" fill sizes="44px" className="object-cover" />}
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium hover:text-leaf">{p.name}</span>
                        <span className="flex gap-1.5 text-[0.8125rem] text-ink-soft">
                          {p.sku || "No SKU"}
                          {p.isFeatured && <Badge tone="leaf" className="py-0 text-[0.6875rem]">Featured</Badge>}
                          {p.isDemo && <Badge tone="outline" className="py-0 text-[0.6875rem]">Demo</Badge>}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="text-ink-soft">{p.category?.name ?? "—"}</td>
                  <td className="text-right font-numeric">
                    {formatINR(p.price)}
                    {p.compareAtPrice ? <span className="block text-[0.8125rem] text-ink-faint line-through">{formatINR(p.compareAtPrice)}</span> : null}
                  </td>
                  <td className={cn("text-right font-medium font-numeric", p.stock === 0 ? "text-danger" : p.stock <= 5 ? "text-[#8a5a00]" : "")}>{p.stock}</td>
                  <td><ProductRowToggle id={p._id} isActive={p.isActive} /></td>
                  <td className="text-right"><Link href={`/admin/products/${p._id}`} className="text-sm font-semibold text-leaf hover:underline">Edit</Link></td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <AdminPagination page={data.page} pages={data.pages} href={(p) => href({ page: p })} />
      </Card>
    </>
  );
}
