import { Droplets, PawPrint, Ruler, Sprout, Wind } from "lucide-react";
import { LightScale } from "@/components/ui/light-scale";
import { CARE_META, LIGHT_META, WATER_META } from "@/lib/plant-care";
import type { ProductDetail } from "@/lib/types";

export function CareProfile({ product }: { product: ProductDetail }) {
  const { care, size } = product;
  const rows: { icon: React.ReactNode; label: string; value: string; hint?: string }[] = [];
  if (care.light)
    rows.push({ icon: <LightScale level={care.light} showLabel={false} />, label: "Light", value: LIGHT_META[care.light].label, hint: LIGHT_META[care.light].hint });
  if (care.water)
    rows.push({ icon: <Droplets className="size-4 text-leaf" strokeWidth={1.8} />, label: "Water", value: WATER_META[care.water].label, hint: WATER_META[care.water].hint });
  if (care.level) rows.push({ icon: <Sprout className="size-4 text-leaf" strokeWidth={1.8} />, label: "Care", value: CARE_META[care.level].label });
  if (care.petSafe !== null)
    rows.push({
      icon: <PawPrint className="size-4 text-leaf" strokeWidth={1.8} />,
      label: "Pets",
      value: care.petSafe ? "Safe for cats and dogs" : "Keep away from pets",
      hint: care.petSafe ? undefined : "Mildly toxic if chewed. Place out of reach of curious pets.",
    });
  if (care.airPurifying) rows.push({ icon: <Wind className="size-4 text-leaf" strokeWidth={1.8} />, label: "Air", value: "Air-purifying" });
  const sizeParts = [size.heightCm && `About ${size.heightCm} cm tall`, size.potSizeIn && `${size.potSizeIn}-inch pot`].filter(Boolean);
  if (sizeParts.length) rows.push({ icon: <Ruler className="size-4 text-leaf" strokeWidth={1.8} />, label: "Size", value: sizeParts.join(", ") });

  if (!rows.length) return null;
  return (
    <dl className="grid gap-px overflow-hidden rounded-[var(--radius-surface)] border border-line bg-line sm:grid-cols-2">
      {rows.map((r) => (
        <div key={r.label} className="flex gap-3 bg-paper p-4">
          <span className="mt-0.5 grid size-5 shrink-0 place-items-center">{r.icon}</span>
          <div className="min-w-0">
            <dt className="text-[0.8125rem] text-ink-soft">{r.label}</dt>
            <dd className="text-[0.9375rem] font-medium leading-snug">{r.value}</dd>
            {r.hint && <dd className="mt-1 text-[0.8125rem] leading-relaxed text-ink-soft">{r.hint}</dd>}
          </div>
        </div>
      ))}
    </dl>
  );
}
