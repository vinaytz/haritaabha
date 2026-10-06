"use client";
import { useEffect, useState, useTransition } from "react";
import { CheckCircle2, MapPin, XCircle } from "lucide-react";
import { checkDelivery } from "@/actions/delivery";
import { formatShortDate } from "@/lib/format";
import type { Serviceability } from "@/server/shipping";

const KEY = "haritaabha-pincode";

export function PincodeCheck({ weightKg }: { weightKg: number }) {
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<Serviceability | { error: string } | null>(null);
  const [pending, start] = useTransition();

  const run = (p: string) =>
    start(async () => {
      const r = await checkDelivery({ pincode: p, weightKg });
      setResult(r);
      if (!("error" in r)) {
        try {
          localStorage.setItem(KEY, p);
        } catch {}
      }
    });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPin(saved);
        run(saved);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="rounded-[var(--radius-surface)] border border-line p-4">
      <p className="mb-3 flex items-center gap-2 text-[0.9375rem] font-semibold">
        <MapPin className="size-4 text-leaf" strokeWidth={2} /> Check delivery
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(pin);
        }}
        className="flex gap-2"
      >
        <label htmlFor="pdp-pincode" className="sr-only">Pincode</label>
        <input
          id="pdp-pincode"
          inputMode="numeric"
          autoComplete="postal-code"
          maxLength={6}
          placeholder="Enter pincode"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          className="h-10 min-w-0 flex-1 rounded-[var(--radius-control)] border border-line-strong px-3 text-[0.9375rem] font-numeric tracking-wide focus:border-leaf focus:outline-none focus:ring-3 focus:ring-leaf/15"
        />
        <button
          type="submit"
          disabled={pin.length !== 6 || pending}
          className="h-10 rounded-[var(--radius-control)] px-4 text-[0.9375rem] font-semibold text-leaf hover:bg-leaf-tint disabled:text-ink-faint disabled:hover:bg-transparent"
        >
          {pending ? "Checking…" : "Check"}
        </button>
      </form>
      {result && (
        <div className="mt-3 text-sm" role="status">
          {"error" in result ? (
            <p className="text-danger">{result.error}</p>
          ) : result.deliverable ? (
            <div className="space-y-1">
              <p className="flex items-center gap-1.5 font-medium text-leaf-deep">
                <CheckCircle2 className="size-4" strokeWidth={2} />
                {result.etaDate ? <>Delivery by {formatShortDate(result.etaDate)}</> : "Delivers to this pincode"}
                {result.city && <span className="font-normal text-ink-soft">· {result.city}</span>}
              </p>
              <p className="pl-[22px] text-ink-soft">{result.cod ? "Cash on delivery available" : "Prepaid orders only for this pincode"}</p>
            </div>
          ) : (
            <p className="flex items-center gap-1.5 text-danger">
              <XCircle className="size-4" strokeWidth={2} /> Sorry, we don’t deliver to this pincode yet.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
