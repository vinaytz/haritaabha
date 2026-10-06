import Image from "next/image";
import { Logo } from "@/components/store/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-2">
      <div className="flex flex-col px-4 py-6 sm:px-8 lg:px-16">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
      <div className="relative hidden bg-canopy lg:block">
        <Image src="/demo/areca-palm-1.webp" alt="" fill sizes="50vw" className="object-cover opacity-80" priority />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-canopy/90 to-transparent p-12 pt-32">
          <p className="max-w-md font-display text-3xl leading-tight text-white">Your orders, addresses and plant care, in one place.</p>
        </div>
      </div>
    </div>
  );
}
