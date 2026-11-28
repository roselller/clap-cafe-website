import { scrollToSection } from "@/lib/smooth-scroll";

/**
 * Lightweight browser CustomEvent bridge connecting #drinks and #cakes without
 * wrapping the Server Component page in a client React context.
 */

const FOCUS_DRINK_EVENT = "clap:focus-drink";
const INSPECT_CAKE_EVENT = "clap:inspect-cake";

/** Scrolls smoothly to #drinks and highlights a specific drink row. */
export function dispatchFocusDrink(drinkName: string): void {
  if (typeof window === "undefined") return;
  scrollToSection("drinks");
  window.dispatchEvent(
    new CustomEvent<string>(FOCUS_DRINK_EVENT, { detail: drinkName }),
  );
}

/** Subscribes to incoming drink-focus requests from the Cakes Tasting Card. */
export function onFocusDrink(handler: (drinkName: string) => void): () => void {
  const listener = (event: Event) => {
    const { detail } = event as CustomEvent<string>;
    if (typeof detail === "string") handler(detail);
  };
  window.addEventListener(FOCUS_DRINK_EVENT, listener);
  return () => window.removeEventListener(FOCUS_DRINK_EVENT, listener);
}

/** Scrolls smoothly to #cakes and opens the Tasting Card for `cakeName`. */
export function dispatchInspectCake(cakeName: string): void {
  if (typeof window === "undefined") return;
  scrollToSection("cakes");
  window.dispatchEvent(
    new CustomEvent<string>(INSPECT_CAKE_EVENT, { detail: cakeName }),
  );
}

/** Subscribes to incoming cake-inspection requests from the Drinks menu. */
export function onInspectCake(handler: (cakeName: string) => void): () => void {
  const listener = (event: Event) => {
    const { detail } = event as CustomEvent<string>;
    if (typeof detail === "string") handler(detail);
  };
  window.addEventListener(INSPECT_CAKE_EVENT, listener);
  return () => window.removeEventListener(INSPECT_CAKE_EVENT, listener);
}
