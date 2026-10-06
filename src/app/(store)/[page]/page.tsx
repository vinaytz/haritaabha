import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { POLICIES } from "@/lib/policies";
import { getSettings } from "@/server/settings";

// Rendered per request (support phone/email come from the DB), so the build never needs a database connection.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps<"/[page]">): Promise<Metadata> {
  const { page } = await params;
  const p = POLICIES[page];
  return p ? { title: p.title, description: p.description, alternates: { canonical: `/${page}` } } : {};
}

export default async function PolicyPage({ params }: PageProps<"/[page]">) {
  const { page } = await params;
  const p = POLICIES[page];
  if (!p) notFound();
  const s = await getSettings();
  return (
    <div className="container-page pb-20 pt-5 md:pt-7">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: p.title }]} />
      <article className="mt-6 max-w-3xl">
        <h1 className="font-display text-[2.25rem] leading-tight md:text-[2.75rem]">{p.title}</h1>
        <p className="mt-2 text-sm text-ink-soft">Last updated {p.updated}</p>
        <div className="prose-plant mt-8">{p.body({ phone: s.supportPhone, email: s.supportEmail })}</div>
      </article>
    </div>
  );
}
