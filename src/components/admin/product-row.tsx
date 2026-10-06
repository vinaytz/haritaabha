"use client";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { setProductFlags } from "@/actions/admin";

export function ProductRowToggle({ id, isActive }: { id: string; isActive: boolean }) {
  const [optimistic, setOptimistic] = useOptimistic(isActive);
  const [, start] = useTransition();
  return (
    <Switch
      checked={optimistic}
      aria-label={optimistic ? "Visible in store" : "Hidden from store"}
      onCheckedChange={(v) =>
        start(async () => {
          setOptimistic(v);
          const r = await setProductFlags(id, { isActive: v });
          if (!r.ok) toast.error(r.error);
        })
      }
    />
  );
}
