import type { Metadata } from "next";
import { getSettings } from "@/server/settings";
import { CartPageClient } from "@/components/store/cart-page";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };

export default async function CartPage() {
  const settings = await getSettings();
  return <CartPageClient freeShippingThreshold={settings.freeShippingThreshold} shippingFee={settings.shippingFee} />;
}
