import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeading({
  title,
  description,
  href,
  linkLabel = "View all",
  className,
  tone = "light",
}: {
  title: string;
  description?: ReactNode;
  href?: string;
  linkLabel?: string;
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div className={cn("mb-7 flex items-end justify-between gap-6 md:mb-9", className)}>
      <div className="max-w-2xl">
        <h2 className={cn("font-display text-[1.75rem] leading-[1.15] tracking-[-0.01em] md:text-[2.25rem]", tone === "dark" ? "text-white" : "text-ink")}>
          {title}
        </h2>
        {description && (
          <p className={cn("mt-2 text-[0.9375rem] md:text-base", tone === "dark" ? "text-white/70" : "text-ink-soft")}>{description}</p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className={cn(
            "shrink-0 text-[0.9375rem] font-semibold underline-offset-4 hover:underline",
            tone === "dark" ? "text-aabha" : "text-leaf",
          )}
        >
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
