import "server-only";
import path from "node:path";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import crypto from "node:crypto";
import ImageKit, { toFile } from "@imagekit/nodejs";
import { env, integrations } from "./env";

let client: ImageKit | null = null;
const ik = () => (client ??= new ImageKit({ privateKey: env.imagekit.privateKey }));

export type StoredImage = { url: string; fileId: string };

/**
 * Stores a product/category image. ImageKit in production; `public/uploads` in local dev
 * (that folder is git-ignored and doesn't persist on Vercel, so it's dev-only).
 */
export async function storeImage(bytes: Buffer, originalName: string, folder: "products" | "categories"): Promise<StoredImage> {
  const ext = (path.extname(originalName) || ".jpg").toLowerCase().replace(/[^.a-z0-9]/g, "");
  const name = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}${ext}`;

  if (integrations.imagekit) {
    const res = await ik().files.upload({ file: await toFile(bytes, name), fileName: name, folder: `/haritaabha/${folder}`, useUniqueFileName: true });
    return { url: res.url!, fileId: res.fileId! };
  }
  if (env.isProd && !env.allowMock) throw new Error("ImageKit is not configured");
  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), bytes);
  return { url: `/uploads/${folder}/${name}`, fileId: "" };
}

export async function deleteImage(img: { url: string; fileId?: string | null }) {
  try {
    if (img.fileId && integrations.imagekit) await ik().files.delete(img.fileId);
    else if (img.url.startsWith("/uploads/")) await unlink(path.join(process.cwd(), "public", img.url));
  } catch {
    // Missing files are fine — the goal is just not to leave orphans behind.
  }
}
