import { requireUser } from "@/lib/session";
import { AccountNav } from "@/components/store/account-nav";

export default async function AccountLayout({ children }: LayoutProps<"/account">) {
  const session = await requireUser("/account");
  return (
    <div className="container-page pb-20 pt-6 md:pt-10">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr] lg:gap-12">
        <div>
          <p className="font-display text-2xl leading-tight">Hi, {session.user.name.split(" ")[0]}</p>
          <p className="mb-5 mt-1 truncate text-sm text-ink-soft">{session.user.email}</p>
          <AccountNav />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
