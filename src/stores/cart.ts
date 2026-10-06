"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { CartLine } from "@/lib/types";

type CartState = {
  lines: CartLine[];
  open: boolean;
  /** id of the line just added — drives the confirmation state in the drawer */
  lastAdded: string | null;
  add: (line: Omit<CartLine, "quantity">, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  /** Replace prices/stock with fresh server data (called when the drawer or cart page opens). */
  reconcile: (fresh: { productId: string; price: number; compareAtPrice: number | null; maxQty: number; name: string; image: string | null; slug: string }[], missing: string[]) => void;
  setOpen: (open: boolean) => void;
};

export const MAX_PER_LINE = 10;

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      open: false,
      lastAdded: null,
      add: (line, qty = 1) =>
        set((s) => {
          const existing = s.lines.find((l) => l.productId === line.productId);
          const cap = Math.min(MAX_PER_LINE, line.maxQty);
          const lines = existing
            ? s.lines.map((l) =>
                l.productId === line.productId ? { ...l, ...line, quantity: Math.min(cap, l.quantity + qty) } : l,
              )
            : [...s.lines, { ...line, quantity: Math.min(cap, qty) }];
          return { lines, open: true, lastAdded: line.productId };
        }),
      setQty: (productId, qty) =>
        set((s) => ({
          lines: s.lines.map((l) =>
            l.productId === productId ? { ...l, quantity: Math.max(1, Math.min(qty, l.maxQty, MAX_PER_LINE)) } : l,
          ),
        })),
      remove: (productId) => set((s) => ({ lines: s.lines.filter((l) => l.productId !== productId) })),
      clear: () => set({ lines: [], lastAdded: null }),
      reconcile: (fresh, missing) =>
        set((s) => ({
          lines: s.lines
            .filter((l) => !missing.includes(l.productId))
            .map((l) => {
              const f = fresh.find((x) => x.productId === l.productId);
              if (!f) return l;
              return { ...l, ...f, quantity: Math.max(0, Math.min(l.quantity, f.maxQty, MAX_PER_LINE)) };
            }),
        })),
      setOpen: (open) => set(open ? { open } : { open, lastAdded: null }),
    }),
    {
      name: "haritaabha-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ lines: s.lines }),
    },
  ),
);

export const cartCount = (lines: CartLine[]) => lines.reduce((n, l) => n + l.quantity, 0);
export const cartSubtotal = (lines: CartLine[]) => lines.reduce((n, l) => n + l.price * l.quantity, 0);
