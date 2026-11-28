"use client";

import Image from "next/image";
import type { RefObject } from "react";
import { DEFAULT_CAKE_IMAGE, formatPrice, type CakeItem } from "@/lib/cafe";

interface CakeDomeProps {
  cake: CakeItem;
  selected: boolean;
  onSelect: () => void;
  buttonRef?: RefObject<HTMLButtonElement | null>;
}

/**
 * Minimalist gallery tile for one cake photographed under its glass dome on an
 * oak stand (transparent PNG floating directly on the warm milk page).
 */
export function CakeDome({
  cake,
  selected,
  onSelect,
  buttonRef,
}: CakeDomeProps) {
  const src = cake.image ?? DEFAULT_CAKE_IMAGE;

  return (
    <li className="text-center">
      <button
        ref={buttonRef}
        type="button"
        onClick={onSelect}
        aria-expanded={selected}
        aria-haspopup="dialog"
        aria-label={`Inspect ${cake.name}, ${formatPrice(cake.price)}`}
        className="cake-tile group block w-full cursor-pointer text-center focus-visible:outline-2 focus-visible:outline-offset-6 focus-visible:outline-espresso"
      >
        <span className="relative block aspect-[8/7] w-full">
          <Image
            src={src}
            alt={cake.name}
            fill
            sizes="(min-width: 1024px) 340px, (min-width: 768px) 30vw, 46vw"
            className={`object-contain object-center transition-transform duration-500 ease-out ${
              selected ? "scale-[1.05]" : "scale-100 group-hover:scale-[1.04]"
            }`}
          />
        </span>

        <span className="mt-1.5 block px-1">
          <span className="inline-flex flex-wrap items-baseline justify-center gap-x-2.5 gap-y-0.5">
            <span className="text-[16px] leading-snug text-espresso transition-opacity group-hover:opacity-70 sm:text-[18px]">
              {cake.name}
            </span>
            <span className="text-[15px] tabular-nums text-espresso/55 sm:text-[16px]">
              {formatPrice(cake.price)}
            </span>
          </span>

          {cake.badge && (
            <span className="mt-1 block text-[11px] uppercase tracking-[0.16em] text-latte-ink/80">
              {cake.badge}
            </span>
          )}
        </span>
      </button>
    </li>
  );
}
