"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { LightScale } from "@/components/ui/light-scale";
import { CARE_LEVELS, CARE_META, LIGHT_LEVELS, LIGHT_META } from "@/lib/plant-care";
import { cn } from "@/lib/utils";

const PRICE = [
  ["under-300", "Under ₹300"],
  ["300-600", "₹300 – ₹600"],
  ["600-1200", "₹600 – ₹1,200"],
  ["over-1200", "Over ₹1,200"],
] as const;

const SORT = [
  ["popular", "Most popular"],
  ["newest", "Newest"],
  ["price-asc", "Price: low to high"],
  ["price-desc", "Price: high to low"],
] as const;

function useParamsState() {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, start] = useTransition();

  const getList = (k: string) => (sp.get(k) ?? "").split(",").filter(Boolean);
  const update = (mut: (p: URLSearchParams) => void) => {
    const p = new URLSearchParams(sp.toString());
    mut(p);
    p.delete("page");
    const qs = p.toString();
    start(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
  };
  const toggle = (k: string, v: string) =>
    update((p) => {
      const cur = (p.get(k) ?? "").split(",").filter(Boolean);
      const next = cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v];
      if (next.length) p.set(k, next.join(","));
      else p.delete(k);
    });
  const flag = (k: string, on: boolean) => update((p) => (on ? p.set(k, "1") : p.delete(k)));
  return { sp, getList, update, toggle, flag, pending };
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  const id = `filter-${title.toLowerCase().replace(/\W+/g, "-")}`;
  return (
    <div role="group" aria-labelledby={id} className="border-b border-line py-5 first:pt-0">
      <h3 id={id} className="mb-3 text-[0.9375rem] font-semibold">{title}</h3>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

export function FilterPanel() {
  const { sp, getList, toggle, flag } = useParamsState();
  return (
    <div>
      <FilterGroup title="Light">
        {LIGHT_LEVELS.map((l) => (
          <Checkbox
            key={l}
            checked={getList("light").includes(l)}
            onChange={() => toggle("light", l)}
            label={
              <span className="flex items-center gap-2.5">
                <LightScale level={l} showLabel={false} />
                {LIGHT_META[l].label}
              </span>
            }
          />
        ))}
      </FilterGroup>
      <FilterGroup title="Care level">
        {CARE_LEVELS.map((l) => (
          <Checkbox key={l} checked={getList("level").includes(l)} onChange={() => toggle("level", l)} label={CARE_META[l].label} />
        ))}
      </FilterGroup>
      <FilterGroup title="Price">
        {PRICE.map(([v, label]) => (
          <Checkbox key={v} checked={getList("price").includes(v)} onChange={() => toggle("price", v)} label={label} />
        ))}
      </FilterGroup>
      <FilterGroup title="More">
        <Checkbox checked={sp.get("pet") === "1"} onChange={(e) => flag("pet", e.target.checked)} label="Safe for pets" />
        <Checkbox checked={sp.get("sale") === "1"} onChange={(e) => flag("sale", e.target.checked)} label="On offer" />
        <Checkbox checked={sp.get("stock") === "1"} onChange={(e) => flag("stock", e.target.checked)} label="In stock only" />
      </FilterGroup>
    </div>
  );
}

const LABELS: Record<string, (v: string) => string> = {
  light: (v) => LIGHT_META[v as keyof typeof LIGHT_META]?.label ?? v,
  level: (v) => CARE_META[v as keyof typeof CARE_META]?.label ?? v,
  price: (v) => PRICE.find(([k]) => k === v)?.[1] ?? v,
};

export function ActiveFilters() {
  const { sp, update } = useParamsState();
  const chips: { key: string; value?: string; label: string }[] = [];
  for (const k of ["light", "level", "price"]) {
    for (const v of (sp.get(k) ?? "").split(",").filter(Boolean)) chips.push({ key: k, value: v, label: LABELS[k](v) });
  }
  if (sp.get("pet") === "1") chips.push({ key: "pet", label: "Safe for pets" });
  if (sp.get("sale") === "1") chips.push({ key: "sale", label: "On offer" });
  if (sp.get("featured") === "1") chips.push({ key: "featured", label: "Our picks" });
  if (sp.get("stock") === "1") chips.push({ key: "stock", label: "In stock only" });
  if (!chips.length) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={`${c.key}-${c.value ?? ""}`}
          type="button"
          onClick={() =>
            update((p) => {
              if (!c.value) return p.delete(c.key);
              const next = (p.get(c.key) ?? "").split(",").filter((x) => x && x !== c.value);
              if (next.length) p.set(c.key, next.join(","));
              else p.delete(c.key);
            })
          }
          className="inline-flex items-center gap-1.5 rounded-full border border-line-strong bg-paper py-1 pl-3 pr-2 text-[0.8125rem] text-ink hover:border-ink"
        >
          {c.label}
          <X className="size-3.5 text-ink-soft" strokeWidth={2} />
          <span className="sr-only">Remove filter</span>
        </button>
      ))}
      <button
        type="button"
        onClick={() => update((p) => ["light", "level", "price", "pet", "sale", "stock", "featured"].forEach((k) => p.delete(k)))}
        className="px-2 text-[0.8125rem] font-semibold text-leaf hover:underline"
      >
        Clear all
      </button>
    </div>
  );
}

export function ListingToolbar({ total }: { total: number }) {
  const { sp, update, pending } = useParamsState();
  const activeCount =
    ["light", "level", "price"].reduce((n, k) => n + (sp.get(k) ?? "").split(",").filter(Boolean).length, 0) +
    ["pet", "sale", "stock", "featured"].filter((k) => sp.get(k) === "1").length;

  return (
    <div className="mb-5 flex items-center justify-between gap-3">
      <p className={cn("whitespace-nowrap text-[0.9375rem] text-ink-soft transition-opacity", pending && "opacity-50")} aria-live="polite">
        {total} {total === 1 ? "product" : "products"}
      </p>
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="secondary" size="sm" className="h-10 lg:hidden">
              <SlidersHorizontal className="size-4" /> Filters{activeCount ? ` (${activeCount})` : ""}
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            title="Filters"
            footer={
              <SheetClose asChild>
                <Button block>Show {total} products</Button>
              </SheetClose>
            }
          >
            <div className="p-5">
              <FilterPanel />
            </div>
          </SheetContent>
        </Sheet>
        <label className="sr-only" htmlFor="sort">
          Sort by
        </label>
        <Select
          id="sort"
          value={sp.get("sort") ?? (sp.get("q") ? "" : "popular")}
          onChange={(e) => update((p) => (e.target.value ? p.set("sort", e.target.value) : p.delete("sort")))}
          className="w-[10rem] sm:w-[11.5rem] [&_select]:h-10 [&_select]:text-sm"
        >
          {sp.get("q") && <option value="">Best match</option>}
          {SORT.map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
