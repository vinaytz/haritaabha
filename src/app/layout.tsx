import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Young_Serif } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@/components/analytics";
import { site } from "@/lib/site";
import "./globals.css";

const hanken = Hanken_Grotesk({ subsets: ["latin"], variable: "--font-hanken", display: "swap" });
const youngSerif = Young_Serif({ subsets: ["latin"], weight: "400", variable: "--font-young-serif", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  openGraph: { type: "website", siteName: site.name, locale: site.locale },
  twitter: { card: "summary_large_image" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#15291a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: browser extensions add attributes to <html> before React hydrates.
    <html lang="en-IN" suppressHydrationWarning className={`${hanken.variable} ${youngSerif.variable} antialiased`}>
      <body className="flex min-h-dvh flex-col">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            classNames: {
              toast: "!rounded-[var(--radius-surface)] !border-line !bg-paper !text-ink !shadow-float !font-sans",
              description: "!text-ink-soft",
            },
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
