import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Leaf, PackageCheck, ShieldCheck } from "lucide-react";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Price } from "@/components/ui/price";
import { Badge } from "@/components/ui/badge";
import { Accordion } from "@/components/ui/accordion";
import { ProductGallery } from "@/components/store/product-gallery";
import { PurchasePanel } from "@/components/store/purchase-panel";
import { PincodeCheck } from "@/components/store/pincode-check";
import { CareProfile } from "@/components/store/care-profile";
import { ProductGrid } from "@/components/store/product-card";
import { SectionHeading } from "@/components/store/section";
import { getProductBySlug, getRelatedProducts } from "@/server/catalog";
import { getSettings } from "@/server/settings";
import { discountPercent, formatINR } from "@/lib/format";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/plants/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  if (!p) return { title: "Plant not found" };
  const title = p.botanicalName && p.botanicalName !== p.name ? `${p.name} (${p.botanicalName})` : p.name;
  return {
    title: `${title} — buy online`,
    description: p.shortDescription || p.description.slice(0, 155),
    alternates: { canonical: `/plants/${p.slug}` },
    openGraph: { title, description: p.shortDescription, images: p.images.slice(0, 1).map((i) => ({ url: i.url, alt: i.alt })) },
  };
}

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="space-y-3">
      {text.split(/\n{2,}/).map((para, i) => (
        <p key={i}>{para}</p>
      ))}
    </div>
  );
}

export default async function ProductPage({ params }: PageProps<"/plants/[slug]">) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const [related, settings] = await Promise.all([getRelatedProducts(product), getSettings()]);
  const off = discountPercent(product.price, product.compareAtPrice);
  const isPlanter = product.category.slug === "planters" || (!product.care.light && !product.care.water);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      description: product.shortDescription || product.description,
      image: product.images.map((i) => (i.url.startsWith("http") ? i.url : `${site.url}${i.url}`)),
      sku: product.sku || undefined,
      category: product.category.name,
      brand: { "@type": "Brand", name: site.name },
      offers: {
        "@type": "Offer",
        url: `${site.url}/plants/${product.slug}`,
        priceCurrency: "INR",
        price: (product.price / 100).toFixed(2),
        availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        itemCondition: "https://schema.org/NewCondition",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: site.url },
        { "@type": "ListItem", position: 2, name: product.category.name, item: `${site.url}/category/${product.category.slug}` },
        { "@type": "ListItem", position: 3, name: product.name },
      ],
    },
  ];

  const accordion = [
    { value: "about", title: "About this plant", content: <Paragraphs text={product.description} /> },
    ...(!isPlanter
      ? [
          {
            value: "care",
            title: "Care guide",
            content: (
              <div className="space-y-3">
                {product.care.notes && <p>{product.care.notes}</p>}
                <p>
                  When it arrives, let it rest in bright, indirect light for a few days before moving it to its final spot. Don’t
                  repot for two to three weeks — the plant needs time to adjust after travelling.
                </p>
              </div>
            ),
          },
        ]
      : []),
    {
      value: "box",
      title: "What you’ll receive",
      content: (
        <ul className="list-disc space-y-1 pl-5">
          {isPlanter ? (
            <li>{product.name}{product.size.label ? ` (${product.size.label})` : ""}</li>
          ) : (
            <>
              <li>
                {product.name}
                {product.size.heightCm ? `, about ${product.size.heightCm} cm tall including the pot` : ""}
              </li>
              <li>{product.size.potIncluded ? `${product.size.potSizeIn ? `${product.size.potSizeIn}-inch ` : ""}nursery pot with soil` : "Plant with root ball (no pot)"}</li>
              <li>Printed care card</li>
            </>
          )}
        </ul>
      ),
    },
    {
      value: "shipping",
      title: "Delivery & returns",
      content: (
        <div className="space-y-2">
          <p>
            Ships across India in 1–2 working days. Delivery usually takes 3–7 days depending on your pincode.
            {settings.freeShippingThreshold > 0 && <> Free delivery on orders above {formatINR(settings.freeShippingThreshold)}.</>}
          </p>
          <p>
            If your plant arrives damaged, send us a photo within 48 hours and we’ll replace it.{" "}
            <Link href="/returns" className="font-medium text-leaf underline underline-offset-2">Read the returns policy</Link>
          </p>
        </div>
      ),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="container-page pb-16 pt-5 md:pt-7">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: product.category.name, href: `/category/${product.category.slug}` },
            { label: product.name },
          ]}
        />
        <div className="mt-5 grid gap-8 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] md:gap-10 lg:gap-16">
          <div className="md:sticky md:top-32 md:self-start">
            <ProductGallery images={product.images} name={product.name} />
          </div>

          <div className="min-w-0">
            {product.botanicalName && <p className="text-[0.9375rem] italic text-ink-soft">{product.botanicalName}</p>}
            <h1 className="mt-1 font-display text-[2rem] leading-[1.1] tracking-[-0.015em] md:text-[2.5rem]">{product.name}</h1>
            {product.shortDescription && <p className="mt-3 text-base leading-relaxed text-ink-soft md:text-[1.0625rem]">{product.shortDescription}</p>}

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Price price={product.price} compareAt={product.compareAtPrice} size="lg" />
              {off > 0 && <Badge tone="marigold">{off}% off</Badge>}
            </div>
            <p className="mt-1 text-[0.8125rem] text-ink-soft">Inclusive of all taxes</p>

            {product.stock <= 0 ? (
              <Badge tone="danger" className="mt-4">Sold out</Badge>
            ) : (
              <p className="mt-4 flex items-center gap-2 text-sm font-medium text-leaf-deep">
                <span className="size-2 rounded-full bg-leaf" aria-hidden="true" /> In stock, ships in 1–2 days
              </p>
            )}

            <div className="mt-6">
              <PurchasePanel product={product} />
            </div>

            <div className="mt-6">
              <PincodeCheck weightKg={product.weightKg} />
            </div>

            {!isPlanter && (
              <div className="mt-8">
                <h2 className="mb-3 text-[0.9375rem] font-semibold">Care at a glance</h2>
                <CareProfile product={product} />
              </div>
            )}

            <Accordion items={accordion} defaultValue={["about"]} className="mt-8" />

            <ul className="mt-6 grid grid-cols-3 gap-3 text-center text-[0.8125rem] text-ink-soft">
              <li className="flex flex-col items-center gap-2">
                <PackageCheck className="size-5 text-leaf" strokeWidth={1.7} /> Packed to travel
              </li>
              <li className="flex flex-col items-center gap-2">
                <Leaf className="size-5 text-leaf" strokeWidth={1.7} /> Replaced if damaged
              </li>
              <li className="flex flex-col items-center gap-2">
                <ShieldCheck className="size-5 text-leaf" strokeWidth={1.7} /> Secure payments
              </li>
            </ul>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-20">
            <SectionHeading title="You may also like" href={`/category/${product.category.slug}`} linkLabel={`More ${product.category.name.toLowerCase()}`} />
            <ProductGrid products={related} />
          </section>
        )}
      </div>
    </>
  );
}
