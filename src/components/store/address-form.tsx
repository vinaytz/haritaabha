"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { INDIAN_STATES } from "@/lib/india";
import { addressSchema, type AddressInput } from "@/lib/validation";

type FormValues = z.input<typeof addressSchema>;

export function AddressForm({
  defaultValues,
  submitLabel = "Save address",
  onSubmit,
  onCancel,
  showSave,
  saveChecked,
  onSaveChange,
  serverErrors,
}: {
  defaultValues?: Partial<AddressInput>;
  submitLabel?: string;
  onSubmit: (values: AddressInput) => Promise<void> | void;
  onCancel?: () => void;
  showSave?: boolean;
  saveChecked?: boolean;
  onSaveChange?: (v: boolean) => void;
  serverErrors?: Record<string, string>;
}) {
  const { register, handleSubmit, formState } = useForm<FormValues, unknown, AddressInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: { state: undefined, ...defaultValues } as FormValues,
  });
  const err = (k: keyof FormValues) => formState.errors[k]?.message ?? serverErrors?.[k];

  return (
    <form noValidate onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2">
      <Field label="Full name" error={err("name")}>
        {(p) => <Input {...p} autoComplete="name" {...register("name")} />}
      </Field>
      <Field label="Mobile number" hint="For delivery updates from the courier" error={err("phone")}>
        {(p) => <Input {...p} type="tel" inputMode="numeric" autoComplete="tel-national" placeholder="10-digit number" {...register("phone")} />}
      </Field>
      <Field label="House / flat, building, street" error={err("line1")} className="sm:col-span-2">
        {(p) => <Input {...p} autoComplete="address-line1" {...register("line1")} />}
      </Field>
      <Field label="Area, locality" optional error={err("line2")} className="sm:col-span-2">
        {(p) => <Input {...p} autoComplete="address-line2" {...register("line2")} />}
      </Field>
      <Field label="Landmark" optional error={err("landmark")}>
        {(p) => <Input {...p} placeholder="Near…" {...register("landmark")} />}
      </Field>
      <Field label="Pincode" error={err("pincode")}>
        {(p) => <Input {...p} inputMode="numeric" maxLength={6} autoComplete="postal-code" {...register("pincode")} />}
      </Field>
      <Field label="City" error={err("city")}>
        {(p) => <Input {...p} autoComplete="address-level2" {...register("city")} />}
      </Field>
      <Field label="State" error={err("state")}>
        {(p) => (
          <Select {...p} autoComplete="address-level1" defaultValue="" {...register("state")}>
            <option value="" disabled>
              Choose a state
            </option>
            {INDIAN_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        )}
      </Field>
      {showSave && (
        <Checkbox
          className="sm:col-span-2"
          checked={saveChecked}
          onChange={(e) => onSaveChange?.(e.target.checked)}
          label="Save this address for next time"
        />
      )}
      <div className="flex gap-3 sm:col-span-2">
        <Button type="submit" loading={formState.isSubmitting}>
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export function AddressBlock({ a, className }: { a: Omit<AddressInput, "state"> & { state: string }; className?: string }) {
  return (
    <address className={`not-italic text-[0.9375rem] leading-relaxed text-ink-soft ${className ?? ""}`}>
      <span className="font-semibold text-ink">{a.name}</span>
      <br />
      {a.line1}
      {a.line2 && <>, {a.line2}</>}
      <br />
      {a.landmark && <>{a.landmark}, </>}
      {a.city}, {a.state} {a.pincode}
      <br />
      <span className="font-numeric">+91 {a.phone}</span>
    </address>
  );
}
