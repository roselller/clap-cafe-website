import { cafe } from "@/lib/cafe";
import type { OpeningHours } from "./types";

/**
 * The single place opening hours come from. Everything else (the Find us section,
 * the footer, the open/closed badge, the JSON-LD) receives an `OpeningHours` value
 * and never knows where it came from.
 *
 * To switch to Google Places later, replace this body with a server-side fetch
 * using `fetch(url, { next: { revalidate: 60 * 60 * 24 } })` and map the result
 * to `OpeningHours`. No component needs to change.
 */
export async function getOpeningHours(): Promise<OpeningHours> {
  return { timezone: cafe.timezone, weekly: cafe.hours };
}
