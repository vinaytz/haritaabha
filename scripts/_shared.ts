import { loadEnvConfig } from "@next/env";
// Same loader as Next.js, so quoting/escaping rules (e.g. \$ in passwords) match the app exactly.
loadEnvConfig(process.cwd(), true, { info() {}, error: console.error });

import mongoose from "mongoose";
import { MongoClient } from "mongodb";
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { admin } from "better-auth/plugins";

export const MONGODB_URI = process.env.MONGODB_URI ?? "";
if (!MONGODB_URI) {
  console.error("MONGODB_URI missing. Copy .env.example to .env.local.");
  process.exit(1);
}

export async function connect() {
  await mongoose.connect(MONGODB_URI);
  const client = new MongoClient(MONGODB_URI);
  await client.connect();
  // Same user/credential storage as the app, so accounts created here can sign in there.
  const auth = betterAuth({
    secret: process.env.BETTER_AUTH_SECRET || "dev-only-insecure-secret-change-me-0000000000",
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    database: mongodbAdapter(client.db(), { client }),
    emailAndPassword: { enabled: true, minPasswordLength: 8 },
    user: { additionalFields: { phone: { type: "string", required: false } } },
    plugins: [admin({ defaultRole: "user", adminRoles: ["admin"] })],
  });
  return {
    auth,
    db: client.db(),
    async close() {
      await mongoose.disconnect();
      await client.close();
    },
  };
}
