"use client";
import Link from "next/link";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => console.error(error), [error]);
  return (
    <main className="container-page flex min-h-[70dvh] flex-col items-start justify-center py-20">
      <p className="text-sm font-semibold text-danger">Something went wrong</p>
      <h1 className="mt-2 max-w-xl font-display text-[2.25rem] leading-tight">We couldn’t load this page.</h1>
      <p className="mt-3 max-w-md text-ink-soft">It’s probably a temporary problem on our side. Try again, and if it keeps happening, contact us.</p>
      {error.digest && <p className="mt-2 text-[0.8125rem] text-ink-faint">Reference: {error.digest}</p>}
      <div className="mt-8 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="secondary"><Link href="/">Go to home</Link></Button>
      </div>
    </main>
  );
}
