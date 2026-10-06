import "server-only";
import { env, integrations, misconfigured } from "./env";
import { connectDB } from "./db";
import { Settings } from "@/models";

const BASE = "https://apiv2.shiprocket.in/v1/external";

export class ShiprocketError extends Error {
  constructor(message: string, public status?: number, public body?: unknown) {
    super(message);
  }
}

// After a failed login, stop retrying for a while: repeated bad logins get the API user blocked by Shiprocket.
const LOGIN_COOLDOWN_MS = 10 * 60 * 1000;
const loginState = globalThis as unknown as { __srLoginFailedAt?: number; __srLoginError?: string };

/** Token lasts ~10 days. Cached in Mongo so every serverless instance shares it. */
async function getToken(force = false): Promise<string> {
  await connectDB();
  if (!force) {
    const s = await Settings.findOne({ key: "store" }).select("+shiprocketToken +shiprocketTokenExpiresAt").lean();
    if (s?.shiprocketToken && s.shiprocketTokenExpiresAt && s.shiprocketTokenExpiresAt.getTime() > Date.now() + 60_000) {
      return s.shiprocketToken;
    }
  }
  if (loginState.__srLoginFailedAt && Date.now() - loginState.__srLoginFailedAt < LOGIN_COOLDOWN_MS) {
    throw new ShiprocketError(`Shiprocket login paused after a failure: ${loginState.__srLoginError}`, 401);
  }
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: env.shiprocket.email, password: env.shiprocket.password }),
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { token?: string; message?: string };
  if (!res.ok || !data.token) {
    loginState.__srLoginFailedAt = Date.now();
    loginState.__srLoginError = data.message || "Shiprocket login failed";
    throw new ShiprocketError(loginState.__srLoginError, res.status, data);
  }
  loginState.__srLoginFailedAt = undefined;
  await Settings.updateOne(
    { key: "store" },
    { $set: { shiprocketToken: data.token, shiprocketTokenExpiresAt: new Date(Date.now() + 9 * 24 * 3600 * 1000) } },
    { upsert: true },
  );
  return data.token;
}

export async function shiprocket<T = unknown>(path: string, init: { method?: string; body?: unknown; query?: Record<string, string | number> } = {}): Promise<T> {
  if (!integrations.shiprocket) {
    const missing = misconfigured.find((i) => i.name === "Shiprocket")?.missing;
    throw new ShiprocketError(missing ? `Shiprocket is not configured: ${missing.join(", ")} is empty` : "Shiprocket is not configured");
  }
  const url = new URL(BASE + path);
  for (const [k, v] of Object.entries(init.query ?? {})) url.searchParams.set(k, String(v));

  const call = async (token: string) =>
    fetch(url, {
      method: init.method ?? (init.body ? "POST" : "GET"),
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: init.body ? JSON.stringify(init.body) : undefined,
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });

  let res = await call(await getToken());
  if (res.status === 401) res = await call(await getToken(true));
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { message?: string }).message || `Shiprocket request failed (${res.status})`;
    throw new ShiprocketError(msg, res.status, data);
  }
  return data as T;
}
