"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, ImagePlus, X } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

export type UploadedImage = { url: string; fileId: string; alt: string };

/** Downscale big phone photos in the browser before upload (keeps uploads fast and under the body limit). */
async function shrink(file: File, max = 2000): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < 1_500_000) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.86));
  return blob ? new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" }) : file;
}

export async function uploadImage(file: File, folder: "products" | "categories"): Promise<UploadedImage> {
  const body = new FormData();
  body.append("file", await shrink(file));
  body.append("folder", folder);
  const res = await fetch("/api/uploads", { method: "POST", body });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Upload failed");
  return { url: data.url, fileId: data.fileId ?? "", alt: "" };
}

export function ImageUploader({ value, onChange, max = 8 }: { value: UploadedImage[]; onChange: (v: UploadedImage[]) => void; max?: number }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(0);
  const [drag, setDrag] = useState(false);

  async function add(files: FileList | File[]) {
    const list = Array.from(files).slice(0, max - value.length);
    if (!list.length) return;
    setBusy(list.length);
    const results: UploadedImage[] = [];
    for (const f of list) {
      try {
        results.push(await uploadImage(f, "products"));
      } catch (e) {
        toast.error(`${f.name}: ${e instanceof Error ? e.message : "upload failed"}`);
      }
      setBusy((b) => b - 1);
    }
    onChange([...value, ...results]);
  }

  const move = (i: number, d: -1 | 1) => {
    const next = [...value];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {value.map((img, i) => (
          <div key={img.url} className="group relative aspect-[4/5] overflow-hidden rounded-lg border border-line bg-mist">
            <Image src={img.url} alt={img.alt} fill sizes="160px" className="object-cover" />
            {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-ink/80 px-1.5 text-[0.6875rem] font-semibold text-white">Main</span>}
            <div className="absolute inset-x-1.5 bottom-1.5 flex justify-between opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100">
              <div className="flex gap-1">
                {i > 0 && (
                  <button type="button" onClick={() => move(i, -1)} className="grid size-7 place-items-center rounded-full bg-paper/95 shadow-sm" aria-label="Move left">
                    <ArrowLeft className="size-3.5" />
                  </button>
                )}
                {i < value.length - 1 && (
                  <button type="button" onClick={() => move(i, 1)} className="grid size-7 place-items-center rounded-full bg-paper/95 shadow-sm" aria-label="Move right">
                    <ArrowRight className="size-3.5" />
                  </button>
                )}
              </div>
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="grid size-7 place-items-center rounded-full bg-paper/95 text-danger shadow-sm" aria-label="Remove photo">
                <X className="size-3.5" />
              </button>
            </div>
          </div>
        ))}
        {Array.from({ length: busy }).map((_, i) => (
          <div key={`busy-${i}`} className="grid aspect-[4/5] place-items-center rounded-lg border border-line bg-mist">
            <Spinner className="size-5 text-ink-soft" />
          </div>
        ))}
        {value.length + busy < max && (
          <button
            type="button"
            onClick={() => input.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); add(e.dataTransfer.files); }}
            className={cn(
              "flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-center text-[0.8125rem] text-ink-soft transition-colors",
              drag ? "border-leaf bg-leaf-tint" : "border-line-strong hover:border-leaf hover:text-ink",
            )}
          >
            <ImagePlus className="size-6" strokeWidth={1.5} />
            Add photos
          </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple hidden onChange={(e) => e.target.files && add(e.target.files)} />
      <p className="mt-2 text-[0.8125rem] text-ink-soft">Up to {max} photos. The first one is the main photo. Portrait (4:5) on a plain background looks best.</p>
    </div>
  );
}
