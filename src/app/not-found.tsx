import Link from "next/link";
import { Logo } from "@/components/store/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="container-page flex h-16 items-center border-b border-line"><Logo /></header>
      <main className="container-page flex flex-1 flex-col items-start justify-center py-20">
        <p className="text-sm font-semibold text-leaf">Error 404</p>
        <h1 className="mt-2 max-w-xl font-display text-[2.5rem] leading-tight md:text-[3.25rem]">This page has wandered off.</h1>
        <p className="mt-3 max-w-md text-ink-soft">The link may be old, or the plant may no longer be in our catalogue. Try searching, or start from our full collection.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild><Link href="/plants">Browse all plants</Link></Button>
          <Button asChild variant="secondary"><Link href="/">Go to home</Link></Button>
        </div>
      </main>
    </div>
  );
}
