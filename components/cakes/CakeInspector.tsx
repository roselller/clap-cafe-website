"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  DEFAULT_CAKE_IMAGE,
  findDrinkByName,
  formatDrinkPriceSummary,
  formatPrice,
  type CakeItem,
} from "@/lib/cafe";
import { dispatchFocusDrink } from "@/lib/menu-events";

const FOCUSABLE_SELECTOR =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface CakeInspectorProps {
  cakes: CakeItem[];
  index: number;
  onClose: () => void;
  onSelectIndex: (nextIndex: number) => void;
}

/**
 * Minimalist Tasting Card dialog opened when selecting any cake in the gallery.
 * Supports keyboard navigation (Escape, ArrowLeft, ArrowRight), strict Tab focus
 * trapping, prev/next cycling, and one-click jump to the recommended drink pairing.
 */
export function CakeInspector({
  cakes,
  index,
  onClose,
  onSelectIndex,
}: CakeInspectorProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const cake = cakes[index];
  const prevIndex = (index - 1 + cakes.length) % cakes.length;
  const nextIndex = (index + 1) % cakes.length;
  const prevCake = cakes[prevIndex];
  const nextCake = cakes[nextIndex];

  const pairingDrink = cake.pairing ? findDrinkByName(cake.pairing.drink) : null;

  // Lock background scroll and set initial focus only when the dialog opens.
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  // Keyboard shortcuts (Escape, ArrowLeft/ArrowRight) and Tab focus trap.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        onSelectIndex((index - 1 + cakes.length) % cakes.length);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        onSelectIndex((index + 1) % cakes.length);
      } else if (event.key === "Tab" && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [cakes.length, index, onClose, onSelectIndex]);

  const handleJumpToDrink = () => {
    const drinkName = cake.pairing?.drink;
    onClose();
    if (drinkName) {
      requestAnimationFrame(() => dispatchFocusDrink(drinkName));
    }
  };

  return (
    <div
      className="tasting-backdrop fixed inset-0 z-50 flex items-end justify-center bg-espresso/45 p-0 backdrop-blur-[4px] sm:items-center sm:p-6"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tasting-card-title"
        className="tasting-card relative flex max-h-[90svh] w-full max-w-[820px] flex-col overflow-hidden rounded-t-[24px] border border-espresso/12 bg-milk text-espresso shadow-[0_24px_70px_rgb(42_26_18/0.25)] sm:rounded-[20px]"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Close button */}
        <button
          ref={closeButtonRef}
          type="button"
          onClick={onClose}
          aria-label="Close tasting card"
          className="absolute right-4 top-4 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-milk/90 text-espresso/75 transition-colors hover:bg-espresso/10 hover:text-espresso focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>

        {/* Scrollable 2-column content */}
        <div className="flex flex-1 flex-col overflow-y-auto md:grid md:grid-cols-[1fr_1.1fr]">
          {/* Left warm-milk photo pane */}
          <div className="flex shrink-0 flex-col items-center justify-center bg-milk px-6 pb-5 pt-8 md:px-8 md:py-10">
            <div className="mb-1 flex w-full items-center justify-between pr-10 text-xs uppercase tracking-[0.14em] text-espresso/45 md:pr-0">
              <span>
                {index + 1} / {cakes.length}
              </span>
              {cake.badge && (
                <span className="text-latte-ink">{cake.badge}</span>
              )}
            </div>

            <div className="relative aspect-[8/7] w-full max-w-[260px] sm:max-w-[320px]">
              <Image
                src={cake.image ?? DEFAULT_CAKE_IMAGE}
                alt={cake.name}
                fill
                sizes="(min-width: 768px) 340px, 280px"
                className="object-contain object-center"
              />
            </div>

            {cake.layersNote && (
              <p className="mt-2 max-w-[32ch] text-center text-sm leading-relaxed text-espresso/60">
                {cake.layersNote}
              </p>
            )}
          </div>

          {/* Right tasting notes pane */}
          <div className="flex flex-col gap-5 border-t border-espresso/10 bg-card p-6 sm:p-8 md:border-l md:border-t-0">
            <div className="md:pr-8">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h3
                  id="tasting-card-title"
                  className="font-display text-[clamp(24px,3vw,30px)] font-normal leading-tight text-espresso"
                >
                  {cake.name}
                </h3>
                <span className="font-display text-xl tabular-nums text-espresso/60">
                  {formatPrice(cake.price)}
                </span>
              </div>

              {cake.flavours && cake.flavours.length > 0 && (
                <p className="mt-2 text-xs uppercase tracking-[0.14em] text-latte-ink">
                  {cake.flavours.join(" · ")}
                </p>
              )}

              {cake.tagline && (
                <p className="mt-3 text-[16px] leading-relaxed text-espresso/80">
                  {cake.tagline}
                </p>
              )}
            </div>

            {/* Slim taste profile bars */}
            {cake.profile && (
              <div className="grid grid-cols-2 gap-6 border-t border-espresso/10 pt-4">
                <ProfileMeter label="Sweetness" level={cake.profile.sweetness} />
                <ProfileMeter label="Richness" level={cake.profile.richness} />
              </div>
            )}

            {/* Recommended drink pairing */}
            {cake.pairing && (
              <div className="border-t border-espresso/10 pt-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-xs uppercase tracking-[0.14em] text-espresso/50">
                    Pairs well with
                  </span>
                  {pairingDrink && (
                    <span className="text-xs tabular-nums text-espresso/55">
                      {formatDrinkPriceSummary(pairingDrink.drink)}
                    </span>
                  )}
                </div>
                <p className="font-display mt-1 text-lg text-espresso">
                  {cake.pairing.drink}
                </p>
                <p className="mt-1 text-sm leading-relaxed text-espresso/70">
                  {cake.pairing.note}
                </p>
                <button
                  type="button"
                  onClick={handleJumpToDrink}
                  className="mt-2.5 inline-flex min-h-9 cursor-pointer items-center gap-1 text-sm text-espresso underline decoration-espresso/35 underline-offset-4 transition-colors hover:decoration-espresso focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso"
                >
                  See in Drinks ↑
                </button>
              </div>
            )}

            {/* Allergens */}
            {cake.allergens && cake.allergens.length > 0 && (
              <div className="border-t border-espresso/10 pt-4 text-xs leading-relaxed text-espresso/55">
                <p>
                  <span className="uppercase tracking-[0.12em] text-espresso/75">
                    Contains:
                  </span>{" "}
                  {cake.allergens.join(" · ")}
                </p>
                <p className="mt-1">
                  Illustrative notes &amp; allergens — not an official menu listing.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quiet prev / next footer bar */}
        <div className="flex items-center justify-between gap-3 border-t border-espresso/10 bg-milk px-5 py-3">
          <button
            type="button"
            onClick={() => onSelectIndex(prevIndex)}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm text-espresso/70 transition-colors hover:text-espresso focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso"
          >
            <span aria-hidden="true">←</span>
            <span className="max-w-[125px] truncate sm:max-w-[200px]">
              {prevCake.name}
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelectIndex(nextIndex)}
            className="inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm text-espresso/70 transition-colors hover:text-espresso focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso"
          >
            <span className="max-w-[125px] truncate sm:max-w-[200px]">
              {nextCake.name}
            </span>
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileMeter({ label, level }: { label: string; level: number }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs uppercase tracking-[0.12em] text-espresso/55">
        <span>{label}</span>
        <span className="tabular-nums">{level}/5</span>
      </div>
      <div
        className="mt-2 flex gap-1"
        role="img"
        aria-label={`${label} ${level} out of 5`}
      >
        {[1, 2, 3, 4, 5].map((dot) => (
          <span
            key={dot}
            className={`h-1 flex-1 rounded-full ${
              dot <= level ? "bg-espresso" : "bg-espresso/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
