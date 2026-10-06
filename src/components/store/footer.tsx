import Link from "next/link";
import { getCategories } from "@/server/catalog";
import { getSettings } from "@/server/settings";
import { Logo } from "./logo";
import { PaymentMarks } from "./payment-marks";

export async function SiteFooter() {
  const [categories, settings] = await Promise.all([getCategories(), getSettings()]);
  const col = "space-y-2.5 text-[0.9375rem]";
  const link = "text-white/70 transition-colors hover:text-white";
  return (
    <footer className="mt-auto bg-canopy text-white">
      <div className="container-page grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="max-w-sm">
          <Logo tone="dark" imgClassName="h-16 md:h-[72px]" />
          <p className="mt-4 text-[0.9375rem] leading-relaxed text-white/70">
            Nursery-grown plants, chosen for the light in Indian homes, packed to travel and delivered across the country.
          </p>
          {(settings.supportPhone || settings.supportEmail) && (
            <div className="mt-5 space-y-1 text-[0.9375rem]">
              {settings.supportPhone && (
                <p>
                  <a href={`tel:${settings.supportPhone}`} className="text-white hover:text-aabha">
                    {settings.supportPhone}
                  </a>
                </p>
              )}
              {settings.supportEmail && (
                <p>
                  <a href={`mailto:${settings.supportEmail}`} className="text-white hover:text-aabha">
                    {settings.supportEmail}
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold text-aabha">Shop</h2>
          <ul className={col}>
            <li><Link href="/plants" className={link}>All plants</Link></li>
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={`/category/${c.slug}`} className={link}>{c.name}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold text-aabha">Help</h2>
          <ul className={col}>
            <li><Link href="/account/orders" className={link}>Track your order</Link></li>
            <li><Link href="/shipping-policy" className={link}>Shipping & delivery</Link></li>
            <li><Link href="/returns" className={link}>Returns & refunds</Link></li>
            <li><Link href="/contact" className={link}>Contact us</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="mb-4 text-sm font-semibold text-aabha">Company</h2>
          <ul className={col}>
            <li><Link href="/about" className={link}>About us</Link></li>
            <li><Link href="/privacy" className={link}>Privacy policy</Link></li>
            <li><Link href="/terms" className={link}>Terms of service</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-[0.8125rem] text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} haritaabha. All rights reserved.</p>
          <div className="flex flex-col gap-2 sm:items-end">
            <PaymentMarks cod={settings.codEnabled} />
            <p>Secure payments by Razorpay</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
