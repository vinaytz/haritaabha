import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/** Session for the current request (memoised per render). */
export const getSession = cache(async () => {
  return auth.api.getSession({ headers: await headers() });
});

export async function requireUser(next?: string) {
  const session = await getSession();
  if (!session) redirect(`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
  return session;
}

export function isAdmin(session: Awaited<ReturnType<typeof getSession>>) {
  return session?.user.role === "admin";
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  if (!isAdmin(session)) redirect("/");
  return session;
}

/** For server actions / route handlers: throw instead of redirecting. */
export class AuthError extends Error {}
export async function assertUser() {
  const session = await getSession();
  if (!session) throw new AuthError("Please sign in to continue.");
  return session;
}
export async function assertAdmin() {
  const session = await getSession();
  if (!session || !isAdmin(session)) throw new AuthError("You don't have access to do that.");
  return session;
}
