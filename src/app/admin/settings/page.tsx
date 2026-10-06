import { connectDB } from "@/lib/db";
import { Order, Settings } from "@/models";
import { PageHeader } from "@/components/admin/ui";
import { SettingsForm } from "@/components/admin/settings-form";
import { env, integrations } from "@/lib/env";

export const metadata = { title: "Settings" };

export default async function AdminSettings() {
  await connectDB();
  const [settings, recent] = await Promise.all([
    Settings.findOneAndUpdate({ key: "store" }, { $setOnInsert: { key: "store" } }, { upsert: true, returnDocument: "after", lean: true }),
    // Last 30 real shipments: what couriers cost vs what customers paid for delivery.
    Order.find({ "shipment.provider": "shiprocket", "shipment.cost": { $gt: 0 } })
      .sort({ createdAt: -1 })
      .limit(30)
      .select("shipment.cost amounts.shipping amounts.codFee")
      .lean(),
  ]);
  const s = settings!;
  const courierStats = recent.length
    ? {
        n: recent.length,
        avgCost: Math.round(recent.reduce((t, o) => t + (o.shipment?.cost ?? 0), 0) / recent.length),
        avgCharged: Math.round(recent.reduce((t, o) => t + o.amounts.shipping + o.amounts.codFee, 0) / recent.length),
      }
    : null;
  return (
    <>
      <PageHeader title="Settings" />
      <SettingsForm
        courierStats={courierStats}
        initial={{
          shippingFee: s.shippingFee / 100,
          freeShippingThreshold: s.freeShippingThreshold / 100,
          codEnabled: s.codEnabled,
          codFee: s.codFee / 100,
          codMaxOrder: s.codMaxOrder / 100,
          announcement: s.announcement,
          pickupPincode: s.pickupPincode,
          supportPhone: s.supportPhone,
          supportEmail: s.supportEmail,
        }}
        integrations={[
          { name: "Razorpay", connected: integrations.razorpay, detail: integrations.razorpay ? `Key ${env.razorpay.keyId.slice(0, 12)}…${env.razorpay.webhookSecret ? " · webhook secret set" : " · webhook secret missing"}` : "Payments are simulated" },
          { name: "Shiprocket", connected: integrations.shiprocket, detail: integrations.shiprocket ? `Pickup location “${env.shiprocket.pickupLocation}”` : "Shipping is simulated" },
          { name: "ImageKit", connected: integrations.imagekit, detail: integrations.imagekit ? env.imagekit.urlEndpoint : "Uploads saved locally (dev only)" },
          { name: "Google sign-in", connected: integrations.google, detail: integrations.google ? "Enabled" : "Button hidden" },
        ]}
        webhookUrls={{ razorpay: `${env.siteUrl}/api/webhooks/razorpay`, shiprocket: `${env.siteUrl}/api/webhooks/courier` }}
      />
    </>
  );
}
