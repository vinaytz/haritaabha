import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SignupForm } from "@/components/store/auth-form";
import { integrations } from "@/lib/env";
import { getSession } from "@/lib/session";

export const metadata: Metadata = { title: "Create account", robots: { index: false } };

export default async function SignupPage() {
  if (await getSession()) redirect("/");
  return (
    <Suspense>
      <SignupForm googleEnabled={integrations.google} />
    </Suspense>
  );
}
