"use client";
import { useCallback, useRef, useState } from "react";
import { FlaskConical } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatINR } from "@/lib/format";

/** Stand-in for Razorpay Checkout while the store has no Razorpay keys (dev/staging only). */
export function useMockPayment() {
  const [state, setState] = useState<{ amount: number } | null>(null);
  const resolver = useRef<((ok: boolean) => void) | null>(null);

  const open = useCallback((amount: number) => {
    setState({ amount });
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const finish = (ok: boolean) => {
    resolver.current?.(ok);
    resolver.current = null;
    setState(null);
  };

  const dialog = (
    <Dialog open={!!state} onOpenChange={(o) => !o && finish(false)}>
      <DialogContent
        title="Test payment"
        description="Razorpay isn’t connected yet, so this simulates the payment window. No money moves."
      >
        <div className="flex items-center gap-3 rounded-[var(--radius-control)] bg-info-tint p-3 text-sm text-info">
          <FlaskConical className="size-4 shrink-0" /> Demo mode — add Razorpay keys to take real payments.
        </div>
        <p className="mt-5 text-[0.9375rem] text-ink-soft">Amount</p>
        <p className="text-2xl font-semibold font-numeric">{state ? formatINR(state.amount) : ""}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => finish(false)}>
            Simulate failure
          </Button>
          <Button onClick={() => finish(true)}>Simulate success</Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  return { open, dialog };
}
