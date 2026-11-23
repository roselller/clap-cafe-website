import raw from "@/content/cafe-data.json";

/**
 * Typed access to /content/cafe-data.json, the single source of truth for
 * all site content. Components import from here, never from the JSON directly.
 */

import type { DayKey } from "@/lib/hours/types";

export type { DayKey };

export interface DrinkItem {
  name: string;
  hot?: number | null;
  iced?: number | null;
  /** Single-price items (fizzy, tea, affogato). */
  price?: number;
  note?: string;
  verify?: string;
}

export interface DrinkSection {
  id: string;
  title: string;
  description?: string;
  items: DrinkItem[];
}

export interface CakeItem {
  name: string;
  price: number;
  verify?: string;
  /** Optional photo path (under /public). When set, it replaces the illustration. */
  image?: string;
}

export interface CafeData {
  name: string;
  tagline: string;
  location: {
    building: string;
    street: string;
    city: string;
    postalCode: string;
    mapsUrl: string;
  };
  phone: string;
  instagram: string;
  timezone: string;
  hours: Record<DayKey, [string, string]>;
  drinks: { notes: string[]; sections: DrinkSection[] };
  food: {
    cakes: { description: string; items: CakeItem[] };
    warmCakes: CakeItem[];
    iceCream: { flavours: string[]; single: number; double: number };
    sandwiches: (CakeItem & { note?: string })[];
  };
}

export const cafe = raw as unknown as CafeData;

export function formatPrice(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}
