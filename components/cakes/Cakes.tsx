import { cafe } from "@/lib/cafe";
import { CakeShowcase } from "./CakeShowcase";
import { CounterExtras } from "./CounterExtras";

/**
 * Minimalist Cakes gallery section on the same warm milk background as the
 * Home section, followed by Warm cake, Ice cream, and Sandwich.
 */
export function Cakes() {
  const { cakes, warmCakes, iceCream, sandwiches } = cafe.food;

  return (
    <section
      id="cakes"
      aria-labelledby="cakes-title"
      className="bg-milk pb-24 text-espresso sm:pb-32"
    >
      {/* Subtle latte-to-milk curve bridging Drinks into Cakes */}
      <div className="bg-latte leading-none" aria-hidden="true">
        <svg
          viewBox="0 0 1440 44"
          preserveAspectRatio="none"
          className="block h-7 w-full sm:h-11"
        >
          <path
            d="M0,8 Q360,44 720,22 T1440,12 L1440,44 L0,44 Z"
            fill="var(--color-milk)"
          />
        </svg>
      </div>

      {/* Airy minimalist header */}
      <div className="mx-auto flex max-w-[1160px] flex-wrap items-end justify-between gap-x-10 gap-y-3 px-6 pt-16 sm:px-10 sm:pt-24">
        <h2
          id="cakes-title"
          className="font-display text-[clamp(48px,7.5vw,88px)] font-normal leading-none"
        >
          Cakes
        </h2>
        {cakes.description && (
          <p className="text-base text-espresso/60 sm:text-lg">
            {cakes.description}
          </p>
        )}
      </div>

      <CakeShowcase cakes={cakes.items} />

      <CounterExtras
        warmCakes={warmCakes}
        iceCream={iceCream}
        sandwiches={sandwiches}
      />
    </section>
  );
}
