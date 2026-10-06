"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { deleteAddress, saveAddress, setDefaultAddress } from "@/actions/addresses";
import type { SavedAddress } from "@/server/account";
import type { AddressInput } from "@/lib/validation";
import { AddressBlock, AddressForm } from "./address-form";

export function AddressBook({ addresses }: { addresses: SavedAddress[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<string | "new" | null>(addresses.length ? null : null);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>();
  const [, start] = useTransition();

  async function submit(values: AddressInput, id?: string) {
    const res = await saveAddress(values, id);
    if (!res.ok) {
      setServerErrors(res.fieldErrors);
      toast.error(res.error);
      return;
    }
    toast.success(id ? "Address updated" : "Address added");
    setEditing(null);
    router.refresh();
  }

  return (
    <div className="mt-6">
      {editing === "new" ? (
        <div className="rounded-[var(--radius-surface)] border border-line p-5 md:p-6">
          <h2 className="mb-5 font-semibold">New address</h2>
          <AddressForm onSubmit={(v) => submit(v)} onCancel={() => setEditing(null)} serverErrors={serverErrors} />
        </div>
      ) : (
        <Button variant="secondary" onClick={() => setEditing("new")}>
          <Plus className="size-4" /> Add address
        </Button>
      )}

      {addresses.length === 0 && editing !== "new" ? (
        <EmptyState icon={<MapPin className="size-6" strokeWidth={1.6} />} title="No saved addresses">
          Save an address to check out faster next time.
        </EmptyState>
      ) : (
        <ul className="mt-6 grid gap-4 md:grid-cols-2">
          {addresses.map((a) =>
            editing === a._id ? (
              <li key={a._id} className="rounded-[var(--radius-surface)] border border-line p-5 md:col-span-2">
                <AddressForm defaultValues={a as unknown as AddressInput} onSubmit={(v) => submit(v, a._id)} onCancel={() => setEditing(null)} serverErrors={serverErrors} />
              </li>
            ) : (
              <li key={a._id} className="flex flex-col rounded-[var(--radius-surface)] border border-line p-5">
                {a.isDefault && <span className="mb-2 text-[0.8125rem] font-semibold text-leaf">Default address</span>}
                <AddressBlock a={a} />
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold">
                  <button className="text-leaf hover:underline" onClick={() => setEditing(a._id)}>Edit</button>
                  {!a.isDefault && (
                    <button className="text-leaf hover:underline" onClick={() => start(async () => { await setDefaultAddress(a._id); router.refresh(); })}>
                      Make default
                    </button>
                  )}
                  <button
                    className="text-ink-soft hover:text-danger"
                    onClick={() =>
                      start(async () => {
                        await deleteAddress(a._id);
                        toast.success("Address removed");
                        router.refresh();
                      })
                    }
                  >
                    Remove
                  </button>
                </div>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
