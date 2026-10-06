import { discountPercent, formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export function Price({
  price,
  compareAt,
  size = "md",
  showSaving = false,
  className,
}: {
  price: number;
  compareAt?: number | null;
  size?: "sm" | "md" | "lg";
  showSaving?: boolean;
  className?: string;
}) {
  const off = discountPercent(price, compareAt);
  return (
    <div className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-0.5 font-numeric", className)}>
      <span
        className={cn(
          "font-semibold text-ink",
          size === "sm" && "text-[0.9375rem]",
          size === "md" && "text-base",
          size === "lg" && "text-[1.75rem] tracking-tight",
        )}
      >
        {formatINR(price)}
      </span>
      {off > 0 && compareAt && (
        <>
          <span className={cn("text-ink-faint line-through", size === "lg" ? "text-lg" : "text-sm")}>
            <span className="sr-only">Was </span>
            {formatINR(compareAt)}
          </span>
          {showSaving && <span className="text-sm font-semibold text-leaf">{off}% off</span>}
        </>
      )}
    </div>
  );
}
