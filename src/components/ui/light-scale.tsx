import { LIGHT_META, type LightLevel } from "@/lib/plant-care";
import { cn } from "@/lib/utils";

/**
 * The brand's light scale: four rising bars, filled up to the plant's light need.
 * Low → bright indirect → sunny window → full sun.
 */
export function LightScale({
  level,
  showLabel = true,
  tone = "light",
  className,
}: {
  level: LightLevel | null | undefined;
  showLabel?: boolean;
  tone?: "light" | "dark";
  className?: string;
}) {
  if (!level) return null;
  const meta = LIGHT_META[level];
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)} title={meta.label}>
      <span className="flex h-3 items-end gap-[2px]" aria-hidden="true">
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn(
              "w-[3px] rounded-[1px]",
              step <= meta.step
                ? tone === "dark"
                  ? "bg-aabha"
                  : "bg-leaf"
                : tone === "dark"
                  ? "bg-white/25"
                  : "bg-line-strong",
            )}
            style={{ height: `${4 + step * 2}px` }}
          />
        ))}
      </span>
      {showLabel ? (
        <span className={cn("text-xs", tone === "dark" ? "text-white/80" : "text-ink-soft")}>{meta.short}</span>
      ) : (
        <span className="sr-only">{meta.label}</span>
      )}
    </span>
  );
}
