import Image from "next/image";
import Link from "next/link";
import { Leaf, Lock, PackageCheck, PawPrint, ShieldCheck, Sprout, Truck } from "lucide-react";
import { PaymentMarks, RazorpayMark } from "@/components/store/payment-marks";
import { getSettings } from "@/server/settings";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/store/product-card";
import { SectionHeading } from "@/components/store/section";
import { getCategories, getLightCounts, getProductBySlug, getProductCards } from "@/server/catalog";
import { formatINR } from "@/lib/format";
import { CARE_META } from "@/lib/plant-care";
import { LIGHT_LEVELS, LIGHT_META } from "@/lib/plant-care";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [settings, featured, categories, lightCounts, bestsellers, easyCare, petSafe, planters] = await Promise.all([
    getSettings(),
    getProductCards({ isFeatured: true, stock: { $gt: 0 } }, { limit: 8, sort: { salesCount: -1 } }),
    getCategories(),
    getLightCounts(),
    getProductCards({ stock: { $gt: 0 } }, { limit: 8, sort: { salesCount: -1 } }),
    getProductCards({ "care.level": "easy", "care.light": { $in: ["low", "indirect"] }, stock: { $gt: 0 } }, { limit: 4, sort: { salesCount: -1 } }),
    getProductCards({ "care.petSafe": true, stock: { $gt: 0 } }, { limit: 4, sort: { salesCount: -1 } }),
    getProductCards({ tags: "planter" }, { limit: 4 }),
  ]);
  // Hero shows the admin's top featured plant; falls back to the monstera, then the bestseller.
  const heroProduct = featured[0] ?? (await getProductBySlug("monstera-deliciosa")) ?? bestsellers[0] ?? null;

  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    url: site.url,
    logo: `${site.url}/logo.png`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }} />

      {/* Hero */}
      <section className="container-page grid items-center gap-8 pb-12 pt-6 md:grid-cols-[1.05fr_1fr] md:gap-12 md:pb-20 md:pt-12 lg:gap-20">
        <div className="order-2 md:order-1">
          <h1 className="font-display text-[2.5rem] leading-[1.06] tracking-[-0.02em] text-canopy sm:text-[3.25rem] lg:text-[4rem]">
            Plants chosen for the light you have.
          </h1>
          <p className="mt-5 max-w-lg text-[1.0625rem] leading-relaxed text-ink-soft md:text-lg">
            A dim corner, a bright window, a sunny balcony — tell us where it will live and we’ll show you plants that will
            thrive there. Nursery-grown, packed to travel, delivered across India.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/plants">Shop all plants</Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="#by-light">Find plants by light</Link>
            </Button>
          </div>
          <div className="mt-10 max-w-xl border-t border-line pt-6">
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium text-ink">
              <li className="flex items-center gap-2"><Truck className="size-4 text-leaf" aria-hidden="true" /> Tracked delivery across India</li>
              <li className="flex items-center gap-2"><Leaf className="size-4 text-leaf" aria-hidden="true" /> Care guide with every plant</li>
            </ul>
            <PaymentMarks className="mt-4" cod={settings.codEnabled} />
            <p className="mt-2.5 flex items-center gap-1.5 text-[0.8125rem] text-ink-soft">
              <Lock className="size-3.5" aria-hidden="true" /> Secure checkout by <RazorpayMark className="ml-0.5 h-3" /> <span className="font-semibold text-ink">Razorpay</span>
            </p>
          </div>
        </div>
        <div className="relative order-1 md:order-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-[var(--radius-surface)] bg-mist sm:aspect-square md:aspect-[4/5]">
            {heroProduct?.image && (
              <Image src={heroProduct.image} alt={heroProduct.name} fill priority sizes="(min-width: 768px) 45vw, 100vw" className="object-cover" />
            )}
          </div>
          {heroProduct && (
            <Link
              href={`/plants/${heroProduct.slug}`}
              className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-4 rounded-[var(--radius-control)] bg-paper/95 px-4 py-3 shadow-float backdrop-blur sm:left-auto sm:w-72"
            >
              <span className="min-w-0">
                <span className="block truncate text-[0.9375rem] font-semibold">{heroProduct.name}</span>
                <span className="block truncate text-[0.8125rem] text-ink-soft">
                  {[heroProduct.light && LIGHT_META[heroProduct.light].label, heroProduct.level && CARE_META[heroProduct.level].label.toLowerCase()]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </span>
              <span className="text-[0.9375rem] font-semibold font-numeric">{formatINR(heroProduct.price)}</span>
            </Link>
          )}
        </div>
      </section>

      {/* Shop by light — the brand's signature */}
      <section id="by-light" className="bg-canopy py-14 md:py-20">
        <div className="container-page">
          <SectionHeading
            tone="dark"
            title="Where will it live?"
            description="Light decides whether a plant thrives or struggles. Start with the spot you have in mind."
          />
          <ul className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
            {LIGHT_LEVELS.map((level) => {
              const meta = LIGHT_META[level];
              return (
                <li key={level}>
                  <Link
                    href={`/plants?light=${level}`}
                    className="group flex h-full flex-col rounded-[var(--radius-surface)] border border-white/10 bg-canopy-soft p-5 transition-colors hover:border-aabha/60 md:p-6"
                  >
                    <span className="flex h-12 items-end gap-1.5" aria-hidden="true">
                      {[1, 2, 3, 4].map((s) => (
                        <span
                          key={s}
                          className={s <= meta.step ? "w-2 rounded-[2px] bg-aabha" : "w-2 rounded-[2px] bg-white/15"}
                          style={{ height: `${12 + s * 9}px` }}
                        />
                      ))}
                    </span>
                    <span className="mt-6 text-lg font-semibold text-white md:text-xl">{meta.label}</span>
                    <span className="mt-1.5 text-sm leading-relaxed text-white/65">{meta.hint}</span>
                    <span className="mt-auto pt-5 text-sm font-semibold text-aabha">
                      {lightCounts[level] ?? 0} plants
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      {/* Categories */}
      <section className="container-page py-14 md:py-20">
        <SectionHeading title="Shop by category" href="/plants" linkLabel="All plants" />
        <ul className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-2 scrollbar-none md:mx-0 md:grid md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-7">
          {categories.map((c) => (
            <li key={c.id} className="w-[38%] shrink-0 snap-start sm:w-[28%] md:w-auto">
              <Link href={`/category/${c.slug}`} className="group block">
                <span className="relative block aspect-square overflow-hidden rounded-[var(--radius-surface)] bg-mist">
                  {c.image && (
                    <Image
                      src={c.image}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 170px, (min-width: 768px) 25vw, 38vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                  )}
                </span>
                <span className="mt-2.5 block text-[0.9375rem] font-medium text-ink group-hover:text-leaf-deep">{c.name}</span>
                <span className="block text-[0.8125rem] text-ink-soft">{c.productCount} products</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Bestsellers */}
      {featured.length > 0 && (
        <section className="container-page pb-14 md:pb-20">
          <SectionHeading title="Our picks" description="Hand-picked by the nursery this season." href="/plants?featured=1" />
          <ProductGrid products={featured} />
        </section>
      )}

      <section className="container-page pb-14 md:pb-20">
        <SectionHeading title="Bestsellers" description="The plants our customers come back for." href="/plants?sort=popular" />
        <ProductGrid products={bestsellers} />
      </section>

      {/* Promise strip */}
      <section className="border-y border-line bg-mist/50">
        <ul className="container-page grid grid-cols-1 gap-6 py-10 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Sprout, title: "Grown at our nursery", body: "Every plant is raised and hardened in our own beds, not stored in a warehouse." },
            { icon: PackageCheck, title: "Packed to travel", body: "Soil is secured and plants are braced in breathable boxes for the journey." },
            { icon: Leaf, title: "Care guide with every plant", body: "Light, water and feeding notes written for Indian seasons." },
            { icon: ShieldCheck, title: "Secure checkout", body: "Pay by UPI, card or net banking through Razorpay, or cash on delivery." },
          ].map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-paper text-leaf">
                <Icon className="size-5" strokeWidth={1.7} />
              </span>
              <span>
                <span className="block font-semibold">{title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-ink-soft">{body}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* Easy care */}
      <section className="container-page py-14 md:py-20">
        <SectionHeading
          title="New to plants? Start here"
          description="Forgiving plants that handle indoor light and the odd missed watering."
          href="/plants?level=easy"
        />
        <ProductGrid products={easyCare} />
      </section>

      {/* Pet-safe feature */}
      <section className="container-page pb-14 md:pb-20">
        <div className="grid overflow-hidden rounded-[var(--radius-surface)] bg-leaf-tint md:grid-cols-2">
          <div className="flex flex-col justify-center p-7 md:p-12">
            <span className="grid size-11 place-items-center rounded-full bg-paper text-leaf">
              <PawPrint className="size-5" strokeWidth={1.8} />
            </span>
            <h2 className="mt-5 font-display text-[1.75rem] leading-[1.15] md:text-[2.25rem]">Safe around cats and dogs</h2>
            <p className="mt-3 max-w-md text-ink-soft">
              Every plant is clearly marked as pet-safe or not, so curious pets and green shelves can share a home.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/plants?pet=1">Shop pet-safe plants</Link>
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 p-3 md:p-4">
            {petSafe.slice(0, 4).map((p) => (
              <Link key={p.id} href={`/plants/${p.slug}`} className="group relative aspect-square overflow-hidden rounded-lg bg-paper">
                {p.image && <Image src={p.image} alt={p.name} fill sizes="(min-width: 768px) 22vw, 45vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.04]" />}
                <span className="absolute inset-x-2 bottom-2 truncate rounded-md bg-paper/95 px-2.5 py-1.5 text-[0.8125rem] font-medium">
                  {p.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Planters */}
      {planters.length > 0 && (
        <section className="container-page pb-16 md:pb-24">
          <SectionHeading title="Planters & pots" description="Terracotta, glazed ceramic and hand-painted pots." href="/category/planters" />
          <ProductGrid products={planters} />
        </section>
      )}
    </>
  );
}
