"use client";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "md",
  label = "Quantity",
  className,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  size?: "sm" | "md";
  label?: string;
  className?: string;
}) {
  const btn = cn(
    "grid place-items-center text-ink transition-colors hover:bg-mist disabled:cursor-not-allowed disabled:text-ink-faint disabled:hover:bg-transparent",
    size === "sm" ? "size-8" : "size-11",
  );
  return (
    <div
      className={cn("inline-flex items-center rounded-[var(--radius-control)] border border-line-strong bg-paper", className)}
      role="group"
      aria-label={label}
    >
      <button type="button" className={btn} onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>
        <Minus className={size === "sm" ? "size-3.5" : "size-4"} strokeWidth={2} />
        <span className="sr-only">Decrease</span>
      </button>
      <span
        className={cn("min-w-8 text-center font-semibold font-numeric", size === "sm" ? "text-sm" : "text-[0.9375rem]")}
        aria-live="polite"
      >
        {value}
      </span>
      <button type="button" className={btn} onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>
        <Plus className={size === "sm" ? "size-3.5" : "size-4"} strokeWidth={2} />
        <span className="sr-only">Increase</span>
      </button>
    </div>
  );
}
