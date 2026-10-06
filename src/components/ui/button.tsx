import { Slot } from "@radix-ui/react-slot";
import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { Spinner } from "./spinner";

const variants = {
  primary: "bg-leaf text-white hover:bg-leaf-deep active:bg-leaf-deep disabled:bg-leaf/50",
  secondary:
    "bg-paper text-ink border border-line-strong hover:border-ink hover:bg-mist/40 disabled:text-ink-faint disabled:border-line",
  ghost: "text-ink hover:bg-mist disabled:text-ink-faint",
  dark: "bg-canopy text-white hover:bg-canopy-soft disabled:bg-canopy/50",
  danger: "bg-danger text-white hover:bg-danger/90 disabled:bg-danger/50",
  "danger-outline": "border border-danger/40 text-danger hover:bg-danger-tint",
  link: "text-leaf underline-offset-4 hover:underline px-0 h-auto",
} as const;

const sizes = {
  sm: "h-9 px-3 text-sm gap-1.5",
  md: "h-11 px-5 text-[0.9375rem] gap-2",
  lg: "h-13 px-7 text-base gap-2",
  icon: "size-10 p-0",
  "icon-sm": "size-8 p-0",
} as const;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
  asChild?: boolean;
  block?: boolean;
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, asChild, block, disabled, children, ...props },
  ref,
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      className={cn(
        "inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap rounded-[var(--radius-control)] font-semibold transition-colors duration-150 disabled:cursor-not-allowed [&_svg]:shrink-0",
        variants[variant],
        sizes[size],
        block && "w-full",
        className,
      )}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && <Spinner className="size-4" />}
          {children}
        </>
      )}
    </Comp>
  );
});
