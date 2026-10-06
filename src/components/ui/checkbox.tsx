import { Check } from "lucide-react";
import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

export const Checkbox = forwardRef<
  HTMLInputElement,
  Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { label: ReactNode; description?: ReactNode }
>(function Checkbox({ label, description, className, ...props }, ref) {
  return (
    <label className={cn("group flex cursor-pointer items-start gap-3 text-[0.9375rem]", className)}>
      <span className="relative mt-[3px] grid size-[18px] shrink-0 place-items-center">
        <input
          ref={ref}
          type="checkbox"
          className="peer size-[18px] cursor-pointer appearance-none rounded-[4px] border border-line-strong bg-paper transition-colors checked:border-leaf checked:bg-leaf group-hover:border-ink-faint focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-leaf"
          {...props}
        />
        <Check
          className="pointer-events-none absolute size-3 text-white opacity-0 peer-checked:opacity-100"
          strokeWidth={3.5}
        />
      </span>
      <span className="flex flex-col">
        <span className="text-ink">{label}</span>
        {description && <span className="text-[0.8125rem] text-ink-soft">{description}</span>}
      </span>
    </label>
  );
});
