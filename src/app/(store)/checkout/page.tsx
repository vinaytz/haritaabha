import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { getAddresses } from "@/server/account";
import { CheckoutClient } from "@/components/store/checkout-client";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function CheckoutPage() {
  const session = await requireUser("/checkout");
  const addresses = await getAddresses(session.user.id);
  return <CheckoutClient addresses={addresses} email={session.user.email} />;
}
