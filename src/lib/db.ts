import "server-only";
import mongoose from "mongoose";
import { MongoClient } from "mongodb";
import { env } from "./env";

/**
 * Two handles on the same database:
 * - Mongoose for our models (validation, indexes)
 * - a native MongoClient for Better Auth's adapter
 * Both are cached on globalThis so dev hot-reloads and serverless warm starts reuse them.
 */
type Cache = {
  mongoose?: Promise<typeof mongoose>;
  client?: MongoClient;
};
const g = globalThis as unknown as { __haritaabhaDb?: Cache };
const cache: Cache = (g.__haritaabhaDb ??= {});

function uri() {
  if (!env.mongoUri) throw new Error("MONGODB_URI is not set. Copy .env.example to .env.local.");
  return env.mongoUri;
}

export async function connectDB() {
  cache.mongoose ??= mongoose
    .connect(uri(), { maxPoolSize: 10, serverSelectionTimeoutMS: 8000 })
    .catch((err) => {
      cache.mongoose = undefined;
      throw err;
    });
  return cache.mongoose;
}

export function getMongoClient(): MongoClient {
  // MongoClient connects lazily on first operation.
  cache.client ??= new MongoClient(uri(), { maxPoolSize: 5 });
  return cache.client;
}
