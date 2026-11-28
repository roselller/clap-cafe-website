"use client";

import { useState } from "react";
import { formatPrice, type CakeItem } from "@/lib/cafe";

interface CounterExtrasProps {
  warmCakes: CakeItem[];
  iceCream: { flavours: string[]; single: number; double: number };
  sandwiches: (CakeItem & { note?: string })[];
}

type ScoopSize = "none" | "single" | "double";

/**
 * Minimalist three-column counter menu below the cake gallery for
 * Warm cakes (with live ice cream scoop pairing), Ice cream, and Sandwich.
 */
export function CounterExtras({
  warmCakes,
  iceCream,
  sandwiches,
}: CounterExtrasProps) {
  const [scoopSize, setScoopSize] = useState<ScoopSize>("none");
  const [scoopFlavour, setScoopFlavour] = useState<string>(
    iceCream.flavours[0] ?? "Vanilla",
  );

  const scoopAddon =
    scoopSize === "single"
      ? iceCream.single
      : scoopSize === "double"
        ? iceCream.double
        : 0;

  return (
    <div className="mx-auto mt-20 max-w-[1160px] border-t border-espresso/12 px-6 pt-12 sm:mt-24 sm:px-10 sm:pt-16">
      <div className="grid gap-x-14 gap-y-12 md:grid-cols-3">
        {/* Warm cake with subtle inline ice cream scoop pairing */}
        <div>
          <h3 className="font-display text-2xl font-normal text-espresso">
            Warm cake
          </h3>

          <div className="mt-4 space-y-3.5">
            {warmCakes.map((cake) => (
              <div key={cake.name}>
                <MenuRow label={cake.name} price={cake.price + scoopAddon} />
                {scoopSize !== "none" && (
                  <p className="text-xs text-latte-ink">
                    with {scoopSize} {scoopFlavour.toLowerCase()} scoop (+
                    {formatPrice(scoopAddon)})
                  </p>
                )}
              </div>
            ))}
          </div>

          <div className="mt-5 border-t border-espresso/10 pt-3.5">
            <p className="text-xs uppercase tracking-[0.12em] text-espresso/50">
              Add ice cream scoop
            </p>
            <div
              className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm"
              role="group"
              aria-label="Pair warm cake with ice cream"
            >
              {(
                [
                  { id: "none", label: "None" },
                  { id: "single", label: `+ Single (${formatPrice(iceCream.single)})` },
                  { id: "double", label: `+ Double (${formatPrice(iceCream.double)})` },
                ] as const
              ).map((option) => (
                <button
                  key={option.id}
                  type="button"
                  aria-pressed={scoopSize === option.id}
                  onClick={() => setScoopSize(option.id)}
                  className={`cursor-pointer text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso ${
                    scoopSize === option.id
                      ? "text-espresso underline underline-offset-4"
                      : "text-espresso/45 hover:text-espresso/80"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {scoopSize !== "none" && (
              <div
                className="mt-2 flex items-center gap-3 text-xs"
                role="group"
                aria-label="Ice cream flavour"
              >
                <span className="uppercase tracking-[0.12em] text-espresso/45">
                  Flavour
                </span>
                {iceCream.flavours.map((flavour) => (
                  <button
                    key={flavour}
                    type="button"
                    aria-pressed={scoopFlavour === flavour}
                    onClick={() => setScoopFlavour(flavour)}
                    className={`cursor-pointer text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso ${
                      scoopFlavour === flavour
                        ? "text-espresso underline underline-offset-4"
                        : "text-espresso/45 hover:text-espresso/80"
                    }`}
                  >
                    {flavour}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Ice cream */}
        <div>
          <h3 className="font-display text-2xl font-normal text-espresso">
            Ice cream
          </h3>
          <p className="mt-1.5 text-sm text-espresso/55">
            {iceCream.flavours.join(" · ")}
          </p>
          <div className="mt-4 space-y-2">
            <MenuRow label="Single" price={iceCream.single} />
            <MenuRow label="Double" price={iceCream.double} />
          </div>
        </div>

        {/* Sandwich */}
        <div>
          <h3 className="font-display text-2xl font-normal text-espresso">
            Sandwich
          </h3>
          <div className="mt-4 space-y-3">
            {sandwiches.map((sandwich) => (
              <div key={sandwich.name}>
                <MenuRow label={sandwich.name} price={sandwich.price} />
                {sandwich.note && (
                  <p className="text-sm text-espresso/55">
                    {sandwich.note.toLowerCase()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MenuRow({ label, price }: { label: string; price: number }) {
  return (
    <p className="flex items-baseline gap-3 py-1 text-[18px] text-espresso">
      <span>{label}</span>
      <span
        className="flex-1 translate-y-[-5px] border-b border-dotted border-espresso/25"
        aria-hidden="true"
      />
      <span className="tabular-nums text-espresso/75">{formatPrice(price)}</span>
    </p>
  );
}
