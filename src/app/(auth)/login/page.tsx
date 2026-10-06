import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/store/auth-form";
import { integrations } from "@/lib/env";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Sign in", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getSession()) {
    const { next } = await searchParams;
    redirect(typeof next === "string" && next.startsWith("/") && !next.startsWith("//") ? next : "/");
  }
  return (
    <Suspense>
      <LoginForm googleEnabled={integrations.google} />
    </Suspense>
  );
}
