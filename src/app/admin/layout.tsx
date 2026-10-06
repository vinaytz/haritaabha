import type { Metadata } from "next";
import { CircleAlert, FlaskConical, TriangleAlert } from "lucide-react";
import { requireAdmin } from "@/lib/session";
import { AdminShell } from "@/components/admin/shell";
import { connectDB } from "@/lib/db";
import Link from "next/link";
import { NEEDS_ATTENTION, Order, Settings } from "@/models";
import { integrations, misconfigured, paymentsMocked, shippingMocked } from "@/lib/env";

export const metadata: Metadata = { title: { default: "Admin", template: "%s · Admin" }, robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireAdmin();
  await connectDB();
  const [attention, settings] = await Promise.all([
    Order.countDocuments(NEEDS_ATTENTION),
    Settings.findOne({ key: "store" }).select("pickupPincode").lean(),
  ]);

  const broken = new Set(misconfigured.map((i) => i.name));
  const missing = [
    paymentsMocked && !broken.has("Razorpay") && "Razorpay (payments are simulated)",
    shippingMocked && "Shiprocket (shipping is simulated)",
    !integrations.imagekit && !broken.has("ImageKit") && "ImageKit (uploads stored locally)",
    !integrations.google && !broken.has("Google sign-in") && "Google sign-in",
  ].filter(Boolean) as string[];

  const needsPickup = integrations.shiprocket && !settings?.pickupPincode;

  const demoBanner = missing.length ? (
    <div className="border-b border-info/20 bg-info-tint px-4 py-2.5 text-[0.8125rem] text-info md:px-8">
      <p className="mx-auto flex max-w-[1200px] items-start gap-2">
        <FlaskConical className="mt-0.5 size-4 shrink-0" />
        <span>
          <span className="font-semibold">Demo mode.</span> Not connected yet: {missing.join(", ")}. Add the keys in the environment settings to go live.
        </span>
      </p>
    </div>
  ) : null;

  const pickupBanner = needsPickup ? (
    <div className="border-b border-marigold/40 bg-marigold-tint px-4 py-2.5 text-[0.8125rem] text-ink md:px-8">
      <p className="mx-auto flex max-w-[1200px] items-start gap-2">
        <TriangleAlert className="mt-0.5 size-4 shrink-0" />
        <span>
          <span className="font-semibold">Pickup pincode missing.</span> Delivery checks and shipping won’t work until you add it in{" "}
          <Link href="/admin/settings" className="font-medium underline underline-offset-2">Settings</Link>.
        </span>
      </p>
    </div>
  ) : null;

  const configBanner = misconfigured.length ? (
    <div className="border-b border-danger/20 bg-danger-tint px-4 py-2.5 text-[0.8125rem] text-danger md:px-8">
      <div className="mx-auto flex max-w-[1200px] items-start gap-2">
        <CircleAlert className="mt-0.5 size-4 shrink-0" />
        <div>
          <p className="font-semibold">Some keys are empty, so these won’t work:</p>
          <ul className="mt-0.5">
            {misconfigured.map((i) => (
              <li key={i.name}>
                {i.name}: <code className="font-mono text-[0.75rem]">{i.missing.join(", ")}</code>
              </li>
            ))}
          </ul>
          <p className="mt-0.5 text-ink-soft">If a value starts with # or contains $, wrap it in single quotes and write each $ as \$.</p>
        </div>
      </div>
    </div>
  ) : null;

  const banners = configBanner || demoBanner || pickupBanner ? <>{configBanner}{demoBanner}{pickupBanner}</> : null;

  return (
    <AdminShell user={session.user.email} attention={attention} banners={banners}>
      {children}
    </AdminShell>
  );
}
