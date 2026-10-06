import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const tones = {
  neutral: "bg-mist text-ink-soft",
  leaf: "bg-leaf-tint text-leaf-deep",
  marigold: "bg-marigold text-ink",
  "marigold-soft": "bg-marigold-tint text-[#7a4d00]",
  danger: "bg-danger-tint text-danger",
  info: "bg-info-tint text-info",
  dark: "bg-canopy text-white",
  outline: "border border-line-strong text-ink-soft",
} as const;

export type BadgeTone = keyof typeof tones;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold leading-5",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
