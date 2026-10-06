"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, ImagePlus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { deleteCategory, reorderCategories, saveCategory } from "@/actions/admin";
import { uploadImage } from "./image-uploader";
import { Card } from "./ui";

type Cat = { _id: string; name: string; slug: string; description: string; image?: { url?: string; fileId?: string }; isActive: boolean; productCount: number };

function CategoryDialog({ cat, open, onOpenChange }: { cat: Cat | null; open: boolean; onOpenChange: (o: boolean) => void }) {
  const router = useRouter();
  const [name, setName] = useState(cat?.name ?? "");
  const [slug, setSlug] = useState(cat?.slug ?? "");
  const [description, setDescription] = useState(cat?.description ?? "");
  const [image, setImage] = useState<{ url: string; fileId: string } | null>(cat?.image?.url ? { url: cat.image.url, fileId: cat.image.fileId ?? "" } : null);
  const [isActive, setIsActive] = useState(cat?.isActive ?? true);
  const [uploading, setUploading] = useState(false);
  const [saving, start] = useTransition();
  const [error, setError] = useState<string>();
  const file = useRef<HTMLInputElement>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={cat ? `Edit ${cat.name}` : "New category"}>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            start(async () => {
              const r = await saveCategory({ name, slug, description, image, isActive }, cat?._id);
              if (!r.ok) return setError(r.error);
              toast.success(cat ? "Category saved" : "Category created");
              onOpenChange(false);
              router.refresh();
            });
          }}
        >
          <Field label="Name">{(p) => <Input {...p} value={name} onChange={(e) => setName(e.target.value)} required />}</Field>
          <Field label="URL slug" optional hint="Leave empty to generate from the name">{(p) => <Input {...p} value={slug} onChange={(e) => setSlug(e.target.value)} />}</Field>
          <Field label="Description" optional>{(p) => <Textarea {...p} rows={2} maxLength={400} value={description} onChange={(e) => setDescription(e.target.value)} />}</Field>
          <div>
            <p className="mb-1.5 text-sm font-medium">Image</p>
            <button type="button" onClick={() => file.current?.click()} className="relative grid size-28 place-items-center overflow-hidden rounded-lg border-2 border-dashed border-line-strong text-ink-soft hover:border-leaf">
              {uploading ? <Spinner className="size-5" /> : image ? <Image src={image.url} alt="" fill sizes="112px" className="object-cover" /> : <ImagePlus className="size-6" strokeWidth={1.5} />}
            </button>
            <input
              ref={file}
              type="file"
              hidden
              accept="image/*"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setUploading(true);
                try {
                  const up = await uploadImage(f, "categories");
                  setImage({ url: up.url, fileId: up.fileId });
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : "Upload failed");
                }
                setUploading(false);
              }}
            />
          </div>
          <label className="flex items-center justify-between">
            <span className="text-sm font-medium">Visible in store</span>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </label>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" loading={saving} disabled={uploading}>Save</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CategoryManager({ categories }: { categories: Cat[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Cat | null | "new">(null);
  const [order, setOrder] = useState(categories);
  const [, start] = useTransition();
  if (order.length !== categories.length || order.some((c, i) => c._id !== categories[i]?._id && !categories.find((x) => x._id === c._id))) {
    setOrder(categories);
  }

  const move = (i: number, d: -1 | 1) => {
    const next = [...order];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setOrder(next);
    start(async () => {
      await reorderCategories(next.map((c) => c._id));
      router.refresh();
    });
  };

  return (
    <>
      <div className="mb-4">
        <Button onClick={() => setEditing("new")}><Plus className="size-4" /> New category</Button>
      </div>
      <Card padded={false}>
        {order.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-soft">No categories yet. Create one to start adding products.</p>
        ) : (
          <ul className="divide-y divide-line">
            {order.map((c, i) => (
              <li key={c._id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex flex-col">
                  <button disabled={i === 0} onClick={() => move(i, -1)} className="grid size-6 place-items-center rounded text-ink-soft hover:bg-mist disabled:opacity-30" aria-label="Move up"><ArrowUp className="size-3.5" /></button>
                  <button disabled={i === order.length - 1} onClick={() => move(i, 1)} className="grid size-6 place-items-center rounded text-ink-soft hover:bg-mist disabled:opacity-30" aria-label="Move down"><ArrowDown className="size-3.5" /></button>
                </div>
                <span className="relative size-12 shrink-0 overflow-hidden rounded-md bg-mist">
                  {c.image?.url && <Image src={c.image.url} alt="" fill sizes="48px" className="object-cover" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{c.name} {!c.isActive && <span className="text-[0.8125rem] font-normal text-ink-soft">· hidden</span>}</p>
                  <p className="text-[0.8125rem] text-ink-soft">
                    <Link href={`/admin/products?category=${c._id}`} className="hover:underline">{c.productCount} products</Link> · /category/{c.slug}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setEditing(c)}>Edit</Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-ink-soft hover:text-danger"
                  onClick={() => start(async () => {
                    if (!confirm(`Delete ${c.name}?`)) return;
                    const r = await deleteCategory(c._id);
                    if (r.ok) toast.success("Category deleted");
                    else toast.error(r.error);
                    router.refresh();
                  })}
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Card>
      {editing && (
        <CategoryDialog
          key={editing === "new" ? "new" : editing._id}
          cat={editing === "new" ? null : editing}
          open
          onOpenChange={(o) => !o && setEditing(null)}
        />
      )}
    </>
  );
}
