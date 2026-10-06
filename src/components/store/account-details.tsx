"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

export function AccountDetailsForm({ name: initialName, email, phone: initialPhone }: { name: string; email: string; phone: string }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [saving, setSaving] = useState(false);
  const phoneOk = phone === "" || /^[6-9]\d{9}$/.test(phone);

  return (
    <form
      className="mt-6 max-w-md space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!phoneOk || name.trim().length < 2) return;
        setSaving(true);
        const { error } = await authClient.updateUser({ name: name.trim(), phone });
        setSaving(false);
        if (error) toast.error(error.message || "Couldn’t save your details.");
        else {
          toast.success("Details saved");
          router.refresh();
        }
      }}
    >
      <Field label="Full name" error={name.trim().length < 2 ? "Enter your name" : undefined}>
        {(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />}
      </Field>
      <Field label="Email" hint="Your email is used to sign in and can’t be changed here.">
        {(p) => <Input {...p} value={email} disabled />}
      </Field>
      <Field label="Mobile number" optional error={phoneOk ? undefined : "Enter a 10-digit Indian mobile number"}>
        {(p) => (
          <Input {...p} type="tel" inputMode="numeric" maxLength={10} value={phone} onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} autoComplete="tel-national" />
        )}
      </Field>
      <Button type="submit" loading={saving}>Save changes</Button>
    </form>
  );
}
