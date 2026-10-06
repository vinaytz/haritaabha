"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ExternalLink, FolderTree, LayoutDashboard, Menu, Package, Settings, ShoppingCart, Users } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { LogoImage } from "@/components/store/logo";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/categories", label: "Categories", icon: FolderTree },
  { href: "/admin/customers", label: "Customers", icon: Users },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function NavLinks({ attention }: { attention: number }) {
  const path = usePathname();
  return (
    <nav className="space-y-0.5 px-3">
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = href === "/admin" ? path === "/admin" : path.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 text-[0.9375rem]",
              active ? "bg-white/10 font-semibold text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="size-[18px]" strokeWidth={1.7} />
            <span className="flex-1">{label}</span>
            {href === "/admin/orders" && attention > 0 && (
              <span className="rounded-full bg-marigold px-1.5 text-xs font-bold leading-5 text-ink">{attention}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

export function AdminShell({ children, user, attention, banners }: { children: React.ReactNode; user: string; attention: number; banners: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setOpen(false), [path]);

  const brand = (
    <Link href="/admin" className="flex items-center gap-2 px-6">
      <LogoImage tone="dark" height={80} className="h-10 w-auto" />
      <span className="ml-1 rounded bg-white/10 px-1.5 text-[0.6875rem] font-semibold text-white/70">Admin</span>
    </Link>
  );

  return (
    // Sidebar is fixed (not a grid column) so it always spans the full window, whatever the page height.
    <div className="admin-shell min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] flex-col bg-canopy py-5 lg:flex">
        {brand}
        <div className="mt-8 flex-1">
          <NavLinks attention={attention} />
        </div>
        <div className="space-y-3 px-6 text-sm">
          <Link href="/" target="_blank" className="flex items-center gap-2 text-white/70 hover:text-white">
            <ExternalLink className="size-4" /> View store
          </Link>
          <p className="truncate text-white/45">{user}</p>
        </div>
      </aside>

      <div className="min-w-0 lg:pl-[248px]">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-paper px-4 lg:hidden">
          <button onClick={() => setOpen(true)} className="-ml-2 grid size-10 place-items-center rounded-full hover:bg-mist" aria-label="Open menu">
            <Menu className="size-5" />
          </button>
          <span className="font-display text-lg">haritaabha admin</span>
        </header>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetContent side="left" title="Menu" className="bg-canopy [&>div:first-child]:border-white/10 [&>div:first-child_h2]:text-white">
            <div className="py-4">
              <NavLinks attention={attention} />
            </div>
          </SheetContent>
        </Sheet>
        {banners}
        <main className="mx-auto max-w-[1200px] px-4 py-6 md:px-8 md:py-8">{children}</main>
      </div>
    </div>
  );
}
