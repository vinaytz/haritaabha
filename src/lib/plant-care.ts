/** Shared vocabulary for plant care — used by models, filters and UI. */

export const LIGHT_LEVELS = ["low", "indirect", "bright", "sun"] as const;
export type LightLevel = (typeof LIGHT_LEVELS)[number];

export const LIGHT_META: Record<LightLevel, { label: string; short: string; step: number; hint: string }> = {
  low: { label: "Low light", short: "Low light", step: 1, hint: "North-facing rooms, corridors, a few metres from a window" },
  indirect: { label: "Bright indirect light", short: "Bright indirect", step: 2, hint: "Near a window, out of direct sun" },
  bright: { label: "Sunny window", short: "Sunny window", step: 3, hint: "A window with a few hours of soft direct sun" },
  sun: { label: "Full sun", short: "Full sun", step: 4, hint: "Balconies, terraces and gardens with 6+ hours of sun" },
};

export const WATER_LEVELS = ["low", "moderate", "frequent"] as const;
export type WaterLevel = (typeof WATER_LEVELS)[number];
export const WATER_META: Record<WaterLevel, { label: string; hint: string }> = {
  low: { label: "Water every 2–3 weeks", hint: "Let the soil dry out completely between waterings" },
  moderate: { label: "Water weekly", hint: "Water when the top 2–3 cm of soil is dry" },
  frequent: { label: "Water every 2–3 days", hint: "Keep the soil lightly moist, never soggy" },
};

export const CARE_LEVELS = ["easy", "moderate", "expert"] as const;
export type CareLevel = (typeof CARE_LEVELS)[number];
export const CARE_META: Record<CareLevel, { label: string }> = {
  easy: { label: "Easy care" },
  moderate: { label: "Some experience" },
  expert: { label: "For experienced growers" },
};
