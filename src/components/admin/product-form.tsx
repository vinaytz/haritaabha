"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "sonner";
import { ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { Card } from "./ui";
import { ImageUploader, type UploadedImage } from "./image-uploader";
import { deleteProduct, saveProduct, type ProductFormInput } from "@/actions/admin";
import { CARE_LEVELS, CARE_META, LIGHT_LEVELS, LIGHT_META, WATER_LEVELS, WATER_META } from "@/lib/plant-care";
import { slugify } from "@/lib/format";

type Values = Omit<ProductFormInput, "images"> & { images?: UploadedImage[] };

export function ProductForm({ id, initial, categories }: { id?: string; initial?: Values; categories: { _id: string; name: string }[] }) {
  const router = useRouter();
  const [images, setImages] = useState<UploadedImage[]>(initial?.images ?? []);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const [slugTouched, setSlugTouched] = useState(Boolean(id));
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { register, handleSubmit, control, setValue, watch, formState } = useForm<Values>({
    defaultValues: initial ?? {
      name: "",
      slug: "",
      botanicalName: "",
      category: categories[0]?._id ?? "",
      shortDescription: "",
      description: "",
      price: "" as unknown as number,
      compareAtPrice: null,
      stock: 0,
      sku: "",
      care: { light: null, water: null, level: null, petSafe: null, airPurifying: false, notes: "" },
      size: { heightCm: null, potSizeIn: null, potIncluded: true, label: "" },
      shipping: { weightKg: 1, lengthCm: 20, breadthCm: 20, heightCm: 30 },
      tags: "",
      isFeatured: false,
      isActive: true,
    },
  });
  const e = (k: string) => serverErrors[k];
  const slug = watch("slug");

  const onSubmit = handleSubmit(async (values) => {
    setServerErrors({});
    const res = await saveProduct({ ...values, images }, id);
    if (!res.ok) {
      setServerErrors(res.fieldErrors ?? {});
      toast.error(res.error);
      return;
    }
    toast.success(id ? "Product saved" : "Product created");
    if (!id) router.replace(`/admin/products/${res.id}`);
    else router.refresh();
  });

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <Card title="Basics">
          <div className="grid gap-4">
            <Field label="Name" error={e("name")}>
              {(p) => (
                <Input
                  {...p}
                  {...register("name", {
                    onChange: (ev) => !slugTouched && setValue("slug", slugify(ev.target.value)),
                  })}
                  placeholder="e.g. Snake plant Laurentii"
                />
              )}
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Botanical name" optional error={e("botanicalName")}>
                {(p) => <Input {...p} {...register("botanicalName")} placeholder="e.g. Dracaena trifasciata" />}
              </Field>
              <Field label="URL" hint={`/plants/${slug || "…"}`} error={e("slug")}>
                {(p) => <Input {...p} {...register("slug", { onChange: () => setSlugTouched(true) })} />}
              </Field>
            </div>
            <Field label="Short description" hint="One or two lines shown under the name. Up to 240 characters." error={e("shortDescription")}>
              {(p) => <Textarea {...p} rows={2} maxLength={240} {...register("shortDescription")} />}
            </Field>
            <Field label="Full description" hint="Leave a blank line between paragraphs." error={e("description")}>
              {(p) => <Textarea {...p} rows={7} {...register("description")} />}
            </Field>
          </div>
        </Card>

        <Card title="Photos">
          <ImageUploader value={images} onChange={setImages} />
        </Card>

        <Card title="Price & stock">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price (₹)" error={e("price")}>
              {(p) => <Input {...p} type="number" inputMode="decimal" min={0} step="1" {...register("price")} />}
            </Field>
            <Field label="Compare-at price (₹)" optional hint="Original price, shown struck through" error={e("compareAtPrice")}>
              {(p) => <Input {...p} type="number" inputMode="decimal" min={0} step="1" {...register("compareAtPrice")} />}
            </Field>
            <Field label="Stock" error={e("stock")}>
              {(p) => <Input {...p} type="number" inputMode="numeric" min={0} step="1" {...register("stock")} />}
            </Field>
            <Field label="SKU" optional error={e("sku")}>
              {(p) => <Input {...p} {...register("sku")} />}
            </Field>
          </div>
        </Card>

        <Card title="Care">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Light" optional>
              {(p) => (
                <Select {...p} {...register("care.light")}>
                  <option value="">Not specified</option>
                  {LIGHT_LEVELS.map((l) => <option key={l} value={l}>{LIGHT_META[l].label}</option>)}
                </Select>
              )}
            </Field>
            <Field label="Watering" optional>
              {(p) => (
                <Select {...p} {...register("care.water")}>
                  <option value="">Not specified</option>
                  {WATER_LEVELS.map((l) => <option key={l} value={l}>{WATER_META[l].label}</option>)}
                </Select>
              )}
            </Field>
            <Field label="Care level" optional>
              {(p) => (
                <Select {...p} {...register("care.level")}>
                  <option value="">Not specified</option>
                  {CARE_LEVELS.map((l) => <option key={l} value={l}>{CARE_META[l].label}</option>)}
                </Select>
              )}
            </Field>
            <Field label="Safe for pets?" optional>
              {(p) => (
                <Controller
                  control={control}
                  name="care.petSafe"
                  render={({ field }) => (
                    <Select {...p} value={field.value === null || field.value === undefined ? "" : String(field.value)} onChange={(ev) => field.onChange(ev.target.value === "" ? null : ev.target.value === "true")}>
                      <option value="">Not specified</option>
                      <option value="true">Yes, pet-safe</option>
                      <option value="false">No, keep away from pets</option>
                    </Select>
                  )}
                />
              )}
            </Field>
            <Field label="Care notes" optional hint="Shown in the care guide on the product page" className="sm:col-span-2">
              {(p) => <Textarea {...p} rows={3} {...register("care.notes")} />}
            </Field>
            <label className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-line p-3 sm:col-span-2">
              <span className="text-sm font-medium">Air-purifying plant</span>
              <Controller control={control} name="care.airPurifying" render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />} />
            </label>
          </div>
        </Card>

        <Card title="Size & shipping">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Plant height (cm)" optional>
              {(p) => <Input {...p} type="number" min={0} {...register("size.heightCm")} />}
            </Field>
            <Field label="Pot size (inches)" optional>
              {(p) => <Input {...p} type="number" min={0} {...register("size.potSizeIn")} />}
            </Field>
            <Field label="Size label" optional hint="e.g. Medium">
              {(p) => <Input {...p} {...register("size.label")} />}
            </Field>
            <label className="flex items-center justify-between gap-3 rounded-[var(--radius-control)] border border-line p-3 sm:col-span-3">
              <span className="text-sm font-medium">Comes in a pot</span>
              <Controller control={control} name="size.potIncluded" render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />} />
            </label>
          </div>
          <p className="mb-3 mt-6 text-sm font-medium">Packed box — used by Shiprocket to price shipping</p>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Weight (kg)" error={e("shipping.weightKg")}>
              {(p) => <Input {...p} type="number" step="0.05" min={0.05} {...register("shipping.weightKg")} />}
            </Field>
            <Field label="Length (cm)" error={e("shipping.lengthCm")}>
              {(p) => <Input {...p} type="number" min={1} {...register("shipping.lengthCm")} />}
            </Field>
            <Field label="Width (cm)" error={e("shipping.breadthCm")}>
              {(p) => <Input {...p} type="number" min={1} {...register("shipping.breadthCm")} />}
            </Field>
            <Field label="Height (cm)" error={e("shipping.heightCm")}>
              {(p) => <Input {...p} type="number" min={1} {...register("shipping.heightCm")} />}
            </Field>
          </div>
        </Card>
      </div>

      <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
        <Card title="Status">
          <div className="space-y-3">
            <label className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-medium">Visible in store</span>
                <span className="block text-[0.8125rem] text-ink-soft">Hidden products can’t be found or bought</span>
              </span>
              <Controller control={control} name="isActive" render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />} />
            </label>
            <label className="flex items-center justify-between gap-3">
              <span>
                <span className="block text-sm font-medium">Featured</span>
                <span className="block text-[0.8125rem] text-ink-soft">Highlighted on the home page</span>
              </span>
              <Controller control={control} name="isFeatured" render={({ field }) => <Switch checked={!!field.value} onCheckedChange={field.onChange} />} />
            </label>
          </div>
        </Card>
        <Card title="Organisation">
          <div className="space-y-4">
            <Field label="Category" error={e("category")}>
              {(p) => (
                <Select {...p} {...register("category")}>
                  {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </Select>
              )}
            </Field>
            <Field label="Tags" optional hint="Comma separated, e.g. beginner, gift, pet-safe">
              {(p) => <Input {...p} {...register("tags")} />}
            </Field>
          </div>
        </Card>
        <div className="flex flex-col gap-2">
          <Button type="submit" size="lg" loading={formState.isSubmitting}>{id ? "Save changes" : "Create product"}</Button>
          {id && initial?.slug && (
            <Button asChild variant="secondary">
              <Link href={`/plants/${initial.slug}`} target="_blank"><ExternalLink className="size-4" /> View in store</Link>
            </Button>
          )}
          {id && (
            <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
              <Button type="button" variant="ghost" className="text-danger hover:bg-danger-tint" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" /> Delete product
              </Button>
              <DialogContent title="Delete this product?" description="Its photos are deleted too. Products that appear in past orders are hidden instead.">
                <div className="flex justify-end gap-3">
                  <DialogClose asChild><Button variant="secondary">Cancel</Button></DialogClose>
                  <Button
                    variant="danger"
                    loading={deleting}
                    onClick={async () => {
                      setDeleting(true);
                      const r = await deleteProduct(id);
                      setDeleting(false);
                      setDeleteOpen(false);
                      if (r.ok) {
                        toast.success("Product deleted");
                        router.replace("/admin/products");
                      } else {
                        toast.message(r.error);
                        router.refresh();
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </form>
  );
}
