import { Check } from "lucide-react";
import { TRACK_STEPS } from "@/lib/order-status";
import type { OrderStatus } from "@/models/Order";
import { cn } from "@/lib/utils";

export function OrderTracker({ status }: { status: OrderStatus }) {
  const current = status === "on_hold" ? 0 : TRACK_STEPS.findIndex((s) => s.status === status);
  return (
    <ol className="grid grid-cols-5 gap-1" aria-label="Order progress">
      {TRACK_STEPS.map((step, i) => {
        const done = i <= current;
        return (
          <li key={step.status} className="relative flex flex-col items-center text-center">
            {i > 0 && (
              <span className={cn("absolute right-1/2 top-3.5 h-0.5 w-full -translate-y-1/2", i <= current ? "bg-leaf" : "bg-line")} aria-hidden="true" />
            )}
            <span
              className={cn(
                "relative z-10 grid size-7 place-items-center rounded-full border-2 bg-paper",
                done ? "border-leaf bg-leaf text-white" : "border-line text-ink-faint",
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} /> : <span className="size-1.5 rounded-full bg-line-strong" />}
            </span>
            <span className={cn("mt-2 text-[0.75rem] leading-tight sm:text-[0.8125rem]", done ? "font-medium text-ink" : "text-ink-soft")}>
              {step.label}
            </span>
            {i === current && <span className="sr-only">(current step)</span>}
          </li>
        );
      })}
    </ol>
  );
}
