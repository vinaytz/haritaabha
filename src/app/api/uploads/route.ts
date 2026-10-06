import { NextResponse, type NextRequest } from "next/server";
import { getSession, isAdmin } from "@/lib/session";
import { storeImage } from "@/lib/imagekit";

const MAX_BYTES = 8 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/avif"]);

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!isAdmin(session)) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  const folder = form?.get("folder") === "categories" ? "categories" : "products";
  if (!(file instanceof File)) return NextResponse.json({ error: "No file" }, { status: 400 });
  if (!TYPES.has(file.type)) return NextResponse.json({ error: "Use a JPG, PNG, WebP or AVIF image." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Image is larger than 8 MB." }, { status: 400 });

  try {
    const stored = await storeImage(Buffer.from(await file.arrayBuffer()), file.name, folder);
    return NextResponse.json(stored);
  } catch (err) {
    console.error("upload failed", err);
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 500 });
  }
}
