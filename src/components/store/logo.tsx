import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

// Source art is 422×240 (cropped, transparent). Height is set per placement; width follows.
const RATIO = 422 / 240;

/** The HAB logo image. `dark` = white version for deep-green surfaces. */
export function LogoImage({ tone = "light", height = 44, className, priority }: { tone?: "light" | "dark"; height?: number; className?: string; priority?: boolean }) {
  return (
    <Image
      src={tone === "dark" ? "/logo-white.png" : "/logo.png"}
      alt="Harit Aabha Bagwani"
      width={Math.round(height * RATIO)}
      height={height}
      priority={priority}
      className={cn("select-none", className)}
    />
  );
}

export function Logo({ tone = "light", className, imgClassName }: { tone?: "light" | "dark"; className?: string; imgClassName?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center", className)} aria-label="haritaabha home">
      <LogoImage tone={tone} height={88} priority={tone === "light"} className={cn("h-11 w-auto md:h-14", imgClassName)} />
    </Link>
  );
}
