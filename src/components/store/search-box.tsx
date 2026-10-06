"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { useEffect, useId, useRef, useState, useTransition } from "react";
import { suggestProducts } from "@/actions/search";
import { formatINR } from "@/lib/format";
import type { ProductCard } from "@/lib/types";
import { cn } from "@/lib/utils";

const POPULAR = ["Snake plant", "Money plant", "Tulsi", "Jade", "Bonsai", "Pet-safe"];

export function SearchBox({ className, autoFocus, onNavigate }: { className?: string; autoFocus?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<ProductCard[]>([]);
  const [active, setActive] = useState(-1);
  const [pending, start] = useTransition();
  const listId = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const visibleResults = q.trim().length >= 2 ? results : [];

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const t = setTimeout(() => start(async () => setResults(await suggestProducts(term))), 180);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function go(href: string) {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (active >= 0 && visibleResults[active]) return go(`/plants/${visibleResults[active].slug}`);
    const term = q.trim();
    if (term) go(`/search?q=${encodeURIComponent(term)}`);
  }

  const showPanel = open && (q.trim().length >= 2 || q.trim().length === 0);

  return (
    <div ref={wrap} className={cn("relative", className)}>
      <form role="search" onSubmit={submit}>
        <label htmlFor={`${listId}-input`} className="sr-only">
          Search plants and planters
        </label>
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-ink-soft" strokeWidth={1.75} />
        <input
          id={`${listId}-input`}
          type="search"
          autoComplete="off"
          autoFocus={autoFocus}
          placeholder="Search plants, planters, care needs…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(-1);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(visibleResults.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(-1, a - 1));
            } else if (e.key === "Escape") setOpen(false);
          }}
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className="h-11 w-full rounded-full border border-line bg-mist/60 pl-10 pr-10 text-[0.9375rem] text-ink placeholder:text-ink-faint transition-colors hover:border-line-strong focus:border-leaf focus:bg-paper focus:outline-none focus:ring-3 focus:ring-leaf/15 [&::-webkit-search-cancel-button]:hidden"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ("")}
            className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-ink-soft hover:bg-mist hover:text-ink"
          >
            <X className="size-4" />
            <span className="sr-only">Clear search</span>
          </button>
        )}
      </form>

      {showPanel && (
        <div
          id={listId}
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-[var(--radius-surface)] border border-line bg-paper shadow-float animate-pop-in"
        >
          {q.trim().length === 0 ? (
            <div className="p-4">
              <p className="mb-2.5 text-[0.8125rem] font-medium text-ink-soft">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {POPULAR.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => go(p === "Pet-safe" ? "/plants?pet=1" : `/search?q=${encodeURIComponent(p)}`)}
                    className="rounded-full border border-line px-3 py-1.5 text-sm text-ink hover:border-leaf hover:text-leaf-deep"
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : visibleResults.length === 0 ? (
            <p className="px-4 py-5 text-sm text-ink-soft">{pending ? "Searching…" : `No plants match “${q.trim()}”.`}</p>
          ) : (
            <>
              <ul className="max-h-[60vh] overflow-y-auto py-1.5">
                {visibleResults.map((p, i) => (
                  <li key={p.id} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                    <Link
                      href={`/plants/${p.slug}`}
                      onClick={() => {
                        setOpen(false);
                        onNavigate?.();
                      }}
                      className={cn("flex items-center gap-3 px-4 py-2 hover:bg-mist/70", i === active && "bg-mist/70")}
                    >
                      <span className="relative size-11 shrink-0 overflow-hidden rounded-md bg-mist">
                        {p.image && <Image src={p.image} alt="" fill sizes="44px" className="object-cover" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[0.9375rem] font-medium text-ink">{p.name}</span>
                        {p.botanicalName && (
                          <span className="block truncate text-[0.8125rem] italic text-ink-soft">{p.botanicalName}</span>
                        )}
                      </span>
                      <span className="text-sm font-semibold font-numeric">{formatINR(p.price)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => go(`/search?q=${encodeURIComponent(q.trim())}`)}
                className="block w-full border-t border-line px-4 py-3 text-left text-sm font-semibold text-leaf hover:bg-mist/60"
              >
                See all results for “{q.trim()}”
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
