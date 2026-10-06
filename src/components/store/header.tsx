import Link from "next/link";
import { getCategories } from "@/server/catalog";
import { getSession, isAdmin } from "@/lib/session";
import { Logo } from "./logo";
import { SearchBox } from "./search-box";
import { CartButton } from "./cart-button";
import { AccountMenu } from "./account-menu";
import { MobileMenu } from "./mobile-menu";
import { MobileSearch } from "./mobile-search";

export async function SiteHeader() {
  const [categories, session] = await Promise.all([getCategories(), getSession()]);
  const user = session
    ? { name: session.user.name, email: session.user.email, image: session.user.image ?? null, admin: isAdmin(session) }
    : null;
  const nav = categories.map((c) => ({ label: c.name, href: `/category/${c.slug}` }));

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/95 backdrop-blur supports-[backdrop-filter]:bg-paper/85">
      <div className="container-page flex h-16 items-center gap-3 md:h-[72px] md:gap-6">
        <MobileMenu nav={nav} user={user} />
        <Logo className="shrink-0" />
        <SearchBox className="mx-auto hidden w-full max-w-xl md:block" />
        <div className="ml-auto flex items-center gap-0.5 md:ml-0">
          <MobileSearch />
          <AccountMenu user={user} />
          <CartButton />
        </div>
      </div>
      <nav aria-label="Categories" className="hidden border-t border-line/70 lg:block">
        <ul className="container-page flex h-11 items-center gap-7 text-[0.875rem]">
          <li>
            <Link href="/plants" className="font-semibold text-ink hover:text-leaf">
              All plants
            </Link>
          </li>
          {nav.map((n) => (
            <li key={n.href}>
              <Link href={n.href} className="text-ink-soft transition-colors hover:text-ink">
                {n.label}
              </Link>
            </li>
          ))}
          <li className="ml-auto">
            <Link href="/plants?sale=1" className="font-semibold text-leaf hover:text-leaf-deep">
              Offers
            </Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
