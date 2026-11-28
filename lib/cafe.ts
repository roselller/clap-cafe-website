import raw from "@/content/cafe-data.json";
import type { DayKey } from "@/lib/hours/types";

/**
 * Typed access to /content/cafe-data.json, the single source of truth for
 * all site content. Components import from here, never from the JSON directly.
 */

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

export interface CakePairing {
  /** Must match a drink name in `cafe.drinks.sections[*].items`. */
  drink: string;
  /** Short note explaining why the pairing works. */
  note: string;
}

export interface CakeProfile {
  /** 1 (light) to 5 (sweet) */
  sweetness: 1 | 2 | 3 | 4 | 5;
  /** 1 (airy) to 5 (rich) */
  richness: 1 | 2 | 3 | 4 | 5;
}

export interface CakeItem {
  name: string;
  price: number;
  verify?: string;
  /** Optional photo path (under /public). Falls back to DEFAULT_CAKE_IMAGE if omitted. */
  image?: string;
  /** Optional counter highlight pill (e.g. "House Favourite"). */
  badge?: string;
  /** Short evocative tasting description shown in the Tasting Card. */
  tagline?: string;
  /** Concise breakdown of the cake's visible layers. */
  layersNote?: string;
  /** 2–3 flavor tags shown in the Tasting Card. */
  flavours?: string[];
  /** Taste profile meters (sweetness & richness, 1–5). */
  profile?: CakeProfile;
  /** Allergen & dietary notes (editable in cafe-data.json). */
  allergens?: string[];
  /** Recommended drink pairing from the Drinks menu. */
  pairing?: CakePairing;
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
    cakes: { description?: string; items: CakeItem[] };
    warmCakes: CakeItem[];
    iceCream: { flavours: string[]; single: number; double: number };
    sandwiches: (CakeItem & { note?: string })[];
  };
}

export const cafe = raw as unknown as CafeData;

export const DEFAULT_CAKE_IMAGE = "/images/cakes/basque-cheese.png";

export function formatPrice(n: number): string {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

/** Looks up a drink item and its parent section by exact name. */
export function findDrinkByName(
  name: string,
): { drink: DrinkItem; section: DrinkSection } | null {
  for (const section of cafe.drinks.sections) {
    const drink = section.items.find((item) => item.name === name);
    if (drink) return { drink, section };
  }
  return null;
}

/** Formats a drink's price(s) into a compact inline summary for pairing cards. */
export function formatDrinkPriceSummary(drink: DrinkItem): string {
  if (drink.price != null) return formatPrice(drink.price);

  const parts: string[] = [];
  if (drink.hot != null) parts.push(`${formatPrice(drink.hot)} Hot`);
  if (drink.iced != null) parts.push(`${formatPrice(drink.iced)} Iced`);
  return parts.join(" / ");
}

/** Returns all display-case cakes whose recommended pairing matches `drinkName`. */
export function getCakesPairedWithDrink(drinkName: string): CakeItem[] {
  return cafe.food.cakes.items.filter(
    (cake) => cake.pairing?.drink === drinkName,
  );
}

/** Returns a single-line copy-friendly address built from cafe-data.json. */
export function getFullAddress(): string {
  const { building, street, city, postalCode } = cafe.location;
  return `${cafe.name} Cafe, ${building}, ${street}, ${city} ${postalCode}`;
}

/** Builds a WhatsApp chat URL from the cafe's phone number with an optional greeting. */
export function getWhatsAppUrl(message?: string): string {
  const digits = cafe.phone.replace(/\D/g, "");
  const query = message ? `?text=${encodeURIComponent(message)}` : "";
  return `https://wa.me/${digits}${query}`;
}
