"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { CheckCircle2, CircleDashed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { saveSettings } from "@/actions/admin";
import { formatINR } from "@/lib/format";
import { Card } from "./ui";

type Values = {
  shippingFee: number;
  freeShippingThreshold: number;
  codEnabled: boolean;
  codFee: number;
  codMaxOrder: number;
  announcement: string;
  pickupPincode: string;
  supportPhone: string;
  supportEmail: string;
};

export function SettingsForm({
  initial,
  integrations,
  webhookUrls,
  courierStats,
}: {
  initial: Values;
  courierStats: { n: number; avgCost: number; avgCharged: number } | null;
  integrations: { name: string; connected: boolean; detail: string }[];
  webhookUrls: { razorpay: string; shiprocket: string };
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { register, handleSubmit, control, watch, formState } = useForm<Values>({ defaultValues: initial });
  const cod = watch("codEnabled");

  return (
    <form
      noValidate
      className="grid gap-6 lg:grid-cols-[1fr_360px]"
      onSubmit={handleSubmit(async (v) => {
        setErrors({});
        const r = await saveSettings(v);
        if (!r.ok) {
          setErrors(r.fieldErrors ?? {});
          toast.error(r.error);
        } else {
          toast.success("Settings saved");
          router.refresh();
        }
      })}
    >
      <div className="space-y-6">
        <Card title="Delivery charges">
          <p className="mb-4 text-sm text-ink-soft">
            Customers pay this flat fee, not the courier’s rate. Shiprocket charges your wallet separately for each shipment, so set the fee to cover your
            typical courier cost.
            {courierStats ? (
              <>
                {" "}
                Your last {courierStats.n} shipments cost <span className="font-semibold text-ink font-numeric">{formatINR(courierStats.avgCost)}</span> on
                average; customers paid <span className="font-semibold text-ink font-numeric">{formatINR(courierStats.avgCharged)}</span> on average for delivery.
              </>
            ) : null}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Delivery fee (₹)" error={errors.shippingFee}>{(p) => <Input {...p} type="number" min={0} {...register("shippingFee")} />}</Field>
            <Field label="Free delivery above (₹)" hint="Set 0 to always charge delivery" error={errors.freeShippingThreshold}>
              {(p) => <Input {...p} type="number" min={0} {...register("freeShippingThreshold")} />}
            </Field>
            <Field label="Pickup pincode" hint="Your nursery’s pincode, used for delivery estimates" error={errors.pickupPincode}>
              {(p) => <Input {...p} inputMode="numeric" maxLength={6} {...register("pickupPincode")} />}
            </Field>
          </div>
        </Card>
        <Card title="Cash on delivery">
          <label className="flex items-center justify-between gap-3">
            <span>
              <span className="block text-sm font-medium">Offer cash on delivery</span>
              <span className="block text-[0.8125rem] text-ink-soft">Customers can still pay online either way</span>
            </span>
            <Controller control={control} name="codEnabled" render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />} />
          </label>
          {cod && (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="COD fee (₹)" error={errors.codFee}>{(p) => <Input {...p} type="number" min={0} {...register("codFee")} />}</Field>
              <Field label="Maximum order value for COD (₹)" error={errors.codMaxOrder}>{(p) => <Input {...p} type="number" min={0} {...register("codMaxOrder")} />}</Field>
            </div>
          )}
        </Card>
        <Card title="Store details">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Announcement bar" hint="Shown at the top of every page. Leave empty to hide." className="sm:col-span-2" error={errors.announcement}>
              {(p) => <Input {...p} maxLength={160} {...register("announcement")} />}
            </Field>
            <Field label="Support phone" optional error={errors.supportPhone}>{(p) => <Input {...p} type="tel" {...register("supportPhone")} />}</Field>
            <Field label="Support email" optional error={errors.supportEmail}>{(p) => <Input {...p} type="email" {...register("supportEmail")} />}</Field>
          </div>
        </Card>
        <Button type="submit" size="lg" loading={formState.isSubmitting}>Save settings</Button>
      </div>

      <div className="space-y-6">
        <Card title="Integrations" padded={false}>
          <ul className="divide-y divide-line">
            {integrations.map((i) => (
              <li key={i.name} className="flex gap-3 px-5 py-3.5">
                {i.connected ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-leaf" /> : <CircleDashed className="mt-0.5 size-4 shrink-0 text-ink-faint" />}
                <div className="min-w-0">
                  <p className="text-sm font-medium">{i.name} <span className="font-normal text-ink-soft">· {i.connected ? "connected" : "not connected"}</span></p>
                  <p className="truncate text-[0.8125rem] text-ink-soft">{i.detail}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="border-t border-line px-5 py-3 text-[0.8125rem] text-ink-soft">API keys live in the hosting environment variables, not here, so they never reach the browser.</p>
        </Card>
        <Card title="Webhook URLs">
          <dl className="space-y-3 text-[0.8125rem]">
            <div><dt className="font-medium">Razorpay</dt><dd className="break-all text-ink-soft font-numeric">{webhookUrls.razorpay}</dd><dd className="text-ink-faint">Events: payment.captured, order.paid, payment.failed</dd></div>
            <div><dt className="font-medium">Shiprocket</dt><dd className="break-all text-ink-soft font-numeric">{webhookUrls.shiprocket}</dd><dd className="text-ink-faint">Token: value of SHIPROCKET_WEBHOOK_TOKEN</dd></div>
          </dl>
        </Card>
      </div>
    </form>
  );
}
