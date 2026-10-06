"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronRight, LayoutDashboard, LogOut, MapPin, Menu, Package, User } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { signOut } from "@/lib/auth-client";
import { LIGHT_LEVELS, LIGHT_META } from "@/lib/plant-care";
import { LightScale } from "@/components/ui/light-scale";
import { Avatar, type HeaderUser } from "./account-menu";
import { Logo } from "./logo";

export function MobileMenu({ nav, user }: { nav: { label: string; href: string }[]; user: HeaderUser }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [pathname]);

  const row = "flex items-center justify-between px-5 py-3.5 text-[0.9375rem] text-ink hover:bg-mist/60";
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="-ml-2 grid size-11 place-items-center rounded-full text-ink hover:bg-mist lg:hidden" aria-label="Open menu">
        <Menu className="size-[22px]" strokeWidth={1.6} />
      </SheetTrigger>
      <SheetContent side="left" title={<Logo imgClassName="h-9 md:h-9" />} description="Site navigation">
        <div className="pb-8">
          {user ? (
            <div className="flex items-center gap-3 border-b border-line px-5 py-4">
              <Avatar name={user.name} image={user.image} size={40} />
              <div className="min-w-0">
                <p className="truncate font-semibold">{user.name}</p>
                <p className="truncate text-[0.8125rem] text-ink-soft">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 border-b border-line p-5">
              <Link href="/login" className="grid h-11 place-items-center rounded-[var(--radius-control)] bg-leaf font-semibold text-white">
                Sign in
              </Link>
              <Link href="/signup" className="grid h-11 place-items-center rounded-[var(--radius-control)] border border-line-strong font-semibold">
                Create account
              </Link>
            </div>
          )}

          <p className="px-5 pb-1 pt-5 text-[0.8125rem] font-medium text-ink-soft">Shop</p>
          <Link href="/plants" className={row}>
            All plants <ChevronRight className="size-4 text-ink-faint" />
          </Link>
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className={row}>
              {n.label} <ChevronRight className="size-4 text-ink-faint" />
            </Link>
          ))}
          <Link href="/plants?sale=1" className={`${row} font-semibold text-leaf`}>
            Offers <ChevronRight className="size-4 text-ink-faint" />
          </Link>

          <p className="px-5 pb-1 pt-5 text-[0.8125rem] font-medium text-ink-soft">Shop by light</p>
          {LIGHT_LEVELS.map((l) => (
            <Link key={l} href={`/plants?light=${l}`} className={row}>
              <span className="flex items-center gap-3">
                <LightScale level={l} showLabel={false} />
                {LIGHT_META[l].label}
              </span>
              <ChevronRight className="size-4 text-ink-faint" />
            </Link>
          ))}

          {user && (
            <>
              <p className="px-5 pb-1 pt-5 text-[0.8125rem] font-medium text-ink-soft">Your account</p>
              <Link href="/account/orders" className={row}>
                <span className="flex items-center gap-3"><Package className="size-4 text-ink-soft" /> My orders</span>
              </Link>
              <Link href="/account/addresses" className={row}>
                <span className="flex items-center gap-3"><MapPin className="size-4 text-ink-soft" /> Addresses</span>
              </Link>
              <Link href="/account" className={row}>
                <span className="flex items-center gap-3"><User className="size-4 text-ink-soft" /> Account details</span>
              </Link>
              {user.admin && (
                <Link href="/admin" className={row}>
                  <span className="flex items-center gap-3"><LayoutDashboard className="size-4 text-ink-soft" /> Admin panel</span>
                </Link>
              )}
              <button
                type="button"
                className={`${row} w-full`}
                onClick={async () => {
                  await signOut();
                  setOpen(false);
                  router.refresh();
                }}
              >
                <span className="flex items-center gap-3"><LogOut className="size-4 text-ink-soft" /> Sign out</span>
              </button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
