"use client";

/** GA4 e-commerce events. No-ops when analytics isn't loaded. Values in rupees, as GA expects. */
type Item = { id: string; name: string; price: number; quantity?: number; category?: string };

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function send(event: string, params: Record<string, unknown>) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") window.gtag("event", event, params);
}

const items = (list: Item[]) =>
  list.map((i) => ({
    item_id: i.id,
    item_name: i.name,
    price: i.price / 100,
    quantity: i.quantity ?? 1,
    item_category: i.category,
  }));
const value = (list: Item[]) => list.reduce((n, i) => n + (i.price / 100) * (i.quantity ?? 1), 0);

export const track = {
  viewItem: (i: Item) => send("view_item", { currency: "INR", value: i.price / 100, items: items([i]) }),
  addToCart: (i: Item) => send("add_to_cart", { currency: "INR", value: value([i]), items: items([i]) }),
  beginCheckout: (list: Item[]) => send("begin_checkout", { currency: "INR", value: value(list), items: items(list) }),
  purchase: (orderNumber: string, total: number, list: Item[]) =>
    send("purchase", { transaction_id: orderNumber, currency: "INR", value: total / 100, items: items(list) }),
  search: (term: string) => send("search", { search_term: term }),
};
