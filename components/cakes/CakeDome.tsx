"use client";

import Image from "next/image";
import { useState } from "react";
import { CAKE_ART, FALLBACK_ART } from "@/lib/cake-art";
import { formatPrice, type CakeItem } from "@/lib/cafe";

/**
 * One cake under its glass dome. The dome lifts on hover (mouse), tap or Enter/Space
 * (touch, keyboard) to reveal the cake. The slot is a fixed 4:3 box: drop a photo path
 * into the cake's `image` field in cafe-data.json and it replaces the illustration.
 */
export function CakeDome({ cake }: { cake: CakeItem }) {
  const [open, setOpen] = useState(false);
  const art = CAKE_ART[cake.name] ?? FALLBACK_ART;
  const total = art.layers.reduce((sum, [h]) => sum + h, 0);

  return (
    <li className="w-[62vw] max-w-[260px] shrink-0 snap-center text-center md:w-auto md:max-w-none md:shrink md:snap-align-none">
      <button
        type="button"
        className="cake-btn relative block aspect-[4/3] w-full"
        aria-pressed={open}
        aria-label={`Lift the glass dome over ${cake.name}`}
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setOpen(false)}
      >
        {/* wooden board */}
        <span className="absolute inset-x-[6%] bottom-0 h-[13%] rounded-[50%] bg-board" aria-hidden="true" />

        {cake.image ? (
          <Image
            src={cake.image}
            alt=""
            fill
            sizes="(min-width: 768px) 30vw, 62vw"
            className="rounded-[50%/20%] object-cover"
          />
        ) : (
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 160 120" aria-hidden="true">
            {(() => {
              let y = 106 - total;
              const x = 80 - art.width / 2;
              return art.layers.map(([h, c], i) => {
                const rect = <rect key={i} x={x} y={y} width={art.width} height={h} fill={c} rx={i === 0 ? 4 : 0} />;
                y += h;
                return rect;
              });
            })()}
          </svg>
        )}

        {/* glass dome: flat outline, lifts to reveal the cake */}
        <svg className="dome absolute inset-0 h-full w-full" viewBox="0 0 160 120" aria-hidden="true">
          <path
            d="M14 108 C14 40 48 14 80 14 C112 14 146 40 146 108 Z"
            fill="rgb(255 255 255 / 0.09)"
            stroke="rgb(255 255 255 / 0.55)"
            strokeWidth="2"
          />
          <circle cx="80" cy="9" r="6" fill="rgb(255 255 255 / 0.2)" stroke="rgb(255 255 255 / 0.55)" strokeWidth="2" />
        </svg>
      </button>

      <p className="mt-4 inline-flex gap-3 rounded-[3px] bg-card px-3 py-1.5 text-[15px] font-medium text-espresso">
        <span>{cake.name}</span>
        <span className="tabular-nums">{formatPrice(cake.price)}</span>
      </p>
    </li>
  );
}
