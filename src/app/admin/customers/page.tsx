import { listCustomers } from "@/server/admin";
import { AdminPagination, Card, PageHeader, SearchForm, Table } from "@/components/admin/ui";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatINR } from "@/lib/format";

export const metadata = { title: "Customers" };

export default async function AdminCustomers({ searchParams }: PageProps<"/admin/customers">) {
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const page = Number(sp.page) || 1;
  const data = await listCustomers({ q, page });
  return (
    <>
      <PageHeader title="Customers" description={`${data.total} accounts`} actions={<SearchForm placeholder="Name, email or phone" defaultValue={q} />} />
      <Card padded={false}>
        {data.items.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-soft">{q ? `No customers match “${q}”.` : "No customers yet."}</p>
        ) : (
          <Table>
            <thead><tr><th>Customer</th><th>Phone</th><th>Joined</th><th className="text-right">Orders</th><th className="text-right">Spent</th><th>Last order</th></tr></thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c.id}>
                  <td>
                    <p className="font-medium">{c.name} {c.role === "admin" && <Badge tone="dark" className="ml-1 py-0 text-[0.6875rem]">Admin</Badge>}</p>
                    <p className="text-[0.8125rem] text-ink-soft">{c.email}</p>
                  </td>
                  <td className="text-ink-soft font-numeric">{c.phone || "—"}</td>
                  <td className="text-ink-soft">{formatDate(c.createdAt)}</td>
                  <td className="text-right font-numeric">{c.orders}</td>
                  <td className="text-right font-medium font-numeric">{formatINR(c.spent)}</td>
                  <td className="text-ink-soft">{c.lastOrder ? formatDate(c.lastOrder) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
        <AdminPagination page={data.page} pages={data.pages} href={(p) => `/admin/customers?${new URLSearchParams({ ...(q ? { q } : {}), page: String(p) })}`} />
      </Card>
    </>
  );
}
