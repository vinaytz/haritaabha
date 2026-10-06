"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { signIn, signUp } from "@/lib/auth-client";

function safeNext(next: string | null) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-[18px]" aria-hidden="true">
      <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3c-1 .7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9h-4v3.1A12 12 0 0 0 12 24z" />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.7V6.6h-4a12 12 0 0 0 0 10.8l4-3z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.4 6.6l4 3.1C6.3 6.9 8.9 4.8 12 4.8z" />
    </svg>
  );
}

export function GoogleButton({ next, enabled }: { next: string; enabled: boolean }) {
  const [loading, setLoading] = useState(false);
  if (!enabled) return null;
  return (
    <>
      <Button
        type="button"
        variant="secondary"
        size="lg"
        block
        loading={loading}
        onClick={async () => {
          setLoading(true);
          await signIn.social({ provider: "google", callbackURL: next });
        }}
      >
        {!loading && <GoogleIcon />} Continue with Google
      </Button>
      <div className="my-6 flex items-center gap-3 text-[0.8125rem] text-ink-faint">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>
    </>
  );
}

const LoginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Enter your password"),
});

export function LoginForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof LoginSchema>>({ resolver: zodResolver(LoginSchema) });

  return (
    <>
      <h1 className="font-display text-[2rem] leading-tight">Sign in</h1>
      <p className="mb-8 mt-2 text-ink-soft">
        New here?{" "}
        <Link href={`/signup${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-leaf hover:underline">
          Create an account
        </Link>
      </p>
      <GoogleButton next={next} enabled={googleEnabled} />
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit(async (v) => {
          setError(null);
          const { error } = await signIn.email({ email: v.email, password: v.password });
          if (error) return setError(error.status === 429 ? "Too many attempts. Try again in a minute." : "That email and password don’t match.");
          router.push(next);
          router.refresh();
        })}
      >
        <Field label="Email" error={formState.errors.email?.message}>
          {(p) => <Input {...p} type="email" autoComplete="email" {...register("email")} />}
        </Field>
        <Field label="Password" error={formState.errors.password?.message}>
          {(p) => <PasswordInput {...p} autoComplete="current-password" {...register("password")} />}
        </Field>
        {error && <p className="rounded-[var(--radius-control)] bg-danger-tint px-3 py-2.5 text-sm text-danger" role="alert">{error}</p>}
        <Button type="submit" size="lg" block loading={formState.isSubmitting}>
          Sign in
        </Button>
      </form>
    </>
  );
}

const SignupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name").max(80),
  email: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(8, "Use at least 8 characters").max(128),
});

export function SignupForm({ googleEnabled }: { googleEnabled: boolean }) {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm<z.infer<typeof SignupSchema>>({ resolver: zodResolver(SignupSchema) });

  return (
    <>
      <h1 className="font-display text-[2rem] leading-tight">Create your account</h1>
      <p className="mb-8 mt-2 text-ink-soft">
        Already have one?{" "}
        <Link href={`/login${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`} className="font-semibold text-leaf hover:underline">
          Sign in
        </Link>
      </p>
      <GoogleButton next={next} enabled={googleEnabled} />
      <form
        noValidate
        className="space-y-4"
        onSubmit={handleSubmit(async (v) => {
          setError(null);
          const { error } = await signUp.email({ name: v.name, email: v.email, password: v.password });
          if (error)
            return setError(
              error.code === "USER_ALREADY_EXISTS" || error.status === 422
                ? "An account with this email already exists. Try signing in."
                : error.message || "Couldn’t create your account. Try again.",
            );
          router.push(next);
          router.refresh();
        })}
      >
        <Field label="Full name" error={formState.errors.name?.message}>
          {(p) => <Input {...p} autoComplete="name" {...register("name")} />}
        </Field>
        <Field label="Email" error={formState.errors.email?.message}>
          {(p) => <Input {...p} type="email" autoComplete="email" {...register("email")} />}
        </Field>
        <Field label="Password" hint="At least 8 characters" error={formState.errors.password?.message}>
          {(p) => <PasswordInput {...p} autoComplete="new-password" {...register("password")} />}
        </Field>
        {error && <p className="rounded-[var(--radius-control)] bg-danger-tint px-3 py-2.5 text-sm text-danger" role="alert">{error}</p>}
        <Button type="submit" size="lg" block loading={formState.isSubmitting}>
          Create account
        </Button>
        <p className="text-center text-[0.8125rem] text-ink-soft">
          By continuing you agree to our <Link href="/terms" className="underline">terms</Link> and{" "}
          <Link href="/privacy" className="underline">privacy policy</Link>.
        </p>
      </form>
    </>
  );
}
