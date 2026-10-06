import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { getAddresses } from "@/server/account";
import { AddressBook } from "@/components/store/address-book";

export const metadata: Metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const session = await requireUser("/account/addresses");
  const addresses = await getAddresses(session.user.id);
  return (
    <>
      <h1 className="font-display text-[2rem] leading-tight">Addresses</h1>
      <AddressBook addresses={addresses} />
    </>
  );
}
