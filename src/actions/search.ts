"use server";
import { searchProducts } from "@/server/catalog";

export async function suggestProducts(q: string) {
  if (typeof q !== "string" || q.trim().length < 2) return [];
  return searchProducts(q, 6);
}
