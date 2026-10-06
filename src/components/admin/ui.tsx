import Link from "next/link";
import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { STATUS_META } from "@/lib/order-status";
import type { OrderStatus } from "@/models/Order";
import { cn } from "@/lib/utils";

export function PageHeader({ title, description, actions, back }: { title: string; description?: ReactNode; actions?: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {back && (
          <Link href={back.href} className="mb-1 inline-block text-sm text-ink-soft hover:text-ink">
            ← {back.label}
          </Link>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className, padded = true }: { title?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; padded?: boolean }) {
  return (
    <section className={cn("rounded-[var(--radius-surface)] border border-line bg-paper", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="font-semibold">{title}</h2>
          {actions}
        </div>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_META[status as OrderStatus];
  return <Badge tone={meta?.tone ?? "neutral"}>{meta?.label ?? status}</Badge>;
}

export function SearchForm({ placeholder, defaultValue, hidden }: { placeholder: string; defaultValue?: string; hidden?: Record<string, string | undefined> }) {
  return (
    <form className="relative w-full max-w-xs" role="search">
      {Object.entries(hidden ?? {}).map(([k, v]) => (v ? <input key={k} type="hidden" name={k} value={v} /> : null))}
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" />
      <input
        name="q"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="h-10 w-full rounded-[var(--radius-control)] border border-line-strong bg-paper pl-9 pr-3 text-sm focus:border-leaf focus:outline-none focus:ring-3 focus:ring-leaf/15"
      />
    </form>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm [&_td]:border-t [&_td]:border-line [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-2.5 [&_th]:text-[0.8125rem] [&_th]:font-medium [&_th]:text-ink-soft">
        {children}
      </table>
    </div>
  );
}

export function AdminPagination({ page, pages, href }: { page: number; pages: number; href: (p: number) => string }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-line px-4 py-3 text-sm">
      <span className="text-ink-soft">Page {page} of {pages}</span>
      <div className="flex gap-2">
        {page > 1 && <Link className="rounded-md border border-line px-3 py-1.5 hover:bg-mist" href={href(page - 1)}>Previous</Link>}
        {page < pages && <Link className="rounded-md border border-line px-3 py-1.5 hover:bg-mist" href={href(page + 1)}>Next</Link>}
      </div>
    </div>
  );
}
