import "server-only";
import { shippingMocked } from "@/lib/env";
import { shiprocket } from "@/lib/shiprocket";
import { connectDB } from "@/lib/db";
import { Settings } from "@/models";

export type Serviceability = {
  deliverable: boolean;
  cod: boolean;
  etaDays: number | null;
  etaDate: string | null; // ISO
  city?: string;
  state?: string;
  mock: boolean;
};

export const PINCODE_RE = /^[1-9][0-9]{5}$/;

async function pickupPincode() {
  await connectDB();
  const s = await Settings.findOne({ key: "store" }).select("pickupPincode").lean();
  return s?.pickupPincode || "";
}

type ServiceabilityResponse = {
  status?: number;
  data?: {
    available_courier_companies?: {
      estimated_delivery_days?: string;
      etd?: string;
      cod?: number;
      city?: string;
      state?: string;
      rating?: number;
      freight_charge?: number;
    }[];
  };
};

/** Can we deliver to this pincode, and roughly when? Mock mode: every valid pincode, 4–7 days. */
export async function checkServiceability(pincode: string, weightKg = 1): Promise<Serviceability> {
  if (!PINCODE_RE.test(pincode)) return { deliverable: false, cod: false, etaDays: null, etaDate: null, mock: shippingMocked };

  if (shippingMocked) {
    const days = 4 + (Number(pincode[0]) % 4); // stable per region so the demo feels plausible
    return { deliverable: true, cod: true, etaDays: days, etaDate: new Date(Date.now() + days * 86400000).toISOString(), mock: true };
  }

  const from = await pickupPincode();
  if (!from) throw new Error("Pickup pincode is not set. Add it in Admin → Settings.");
  const res = await shiprocket<ServiceabilityResponse>("/courier/serviceability/", {
    query: { pickup_postcode: from, delivery_postcode: pincode, weight: Math.max(0.5, weightKg), cod: 1 },
  });
  const couriers = res.data?.available_courier_companies ?? [];
  if (!couriers.length) return { deliverable: false, cod: false, etaDays: null, etaDate: null, mock: false };

  const days = Math.min(...couriers.map((c) => Number(c.estimated_delivery_days) || 99));
  const etaDays = Number.isFinite(days) && days < 99 ? days + 1 : null; // +1 day for packing at the nursery
  return {
    deliverable: true,
    cod: couriers.some((c) => c.cod === 1),
    etaDays,
    etaDate: etaDays ? new Date(Date.now() + etaDays * 86400000).toISOString() : null,
    city: couriers[0]?.city,
    state: couriers[0]?.state,
    mock: false,
  };
}
