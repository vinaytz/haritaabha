import type { Metadata } from "next";
import { requireUser } from "@/lib/session";
import { AccountDetailsForm } from "@/components/store/account-details";

export const metadata: Metadata = { title: "Account details" };

export default async function AccountPage() {
  const session = await requireUser("/account");
  const u = session.user as typeof session.user & { phone?: string | null };
  return (
    <>
      <h1 className="font-display text-[2rem] leading-tight">Account details</h1>
      <AccountDetailsForm name={u.name} email={u.email} phone={u.phone ?? ""} />
    </>
  );
}
