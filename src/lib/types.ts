import type { CareLevel, LightLevel, WaterLevel } from "./plant-care";

/** Plain, serialisable shapes passed from server to client components. */

export type CategoryLite = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string | null;
  productCount?: number;
};

export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  botanicalName: string;
  image: string | null;
  hoverImage: string | null;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  light: LightLevel | null;
  level: CareLevel | null;
  petSafe: boolean | null;
  categorySlug?: string;
};

export type ProductDetail = ProductCard & {
  shortDescription: string;
  description: string;
  images: { url: string; alt: string }[];
  sku: string;
  category: { name: string; slug: string };
  care: {
    light: LightLevel | null;
    water: WaterLevel | null;
    level: CareLevel | null;
    petSafe: boolean | null;
    airPurifying: boolean;
    notes: string;
  };
  size: { heightCm: number | null; potSizeIn: number | null; potIncluded: boolean; label: string };
  tags: string[];
  weightKg: number;
};

export type CartLine = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
  compareAtPrice: number | null;
  quantity: number;
  maxQty: number;
};

export type StoreSettings = {
  shippingFee: number;
  freeShippingThreshold: number;
  codEnabled: boolean;
  codFee: number;
  codMaxOrder: number;
  announcement: string;
  supportPhone: string;
  supportEmail: string;
};
