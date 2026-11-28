"use client";

import { useEffect, useRef, useState } from "react";
import {
  formatPrice,
  getCakesPairedWithDrink,
  type DrinkItem,
  type DrinkSection,
} from "@/lib/cafe";
import { dispatchInspectCake, onFocusDrink } from "@/lib/menu-events";
import { Float } from "./Float";

type TempFocus = "all" | "hot" | "iced";

interface DrinksMenuProps {
  sections: DrinkSection[];
}

/** Whether a drink item is available in the selected temperature focus. */
function matchesTemperature(
  item: DrinkItem,
  sectionId: string,
  temp: TempFocus,
): boolean {
  if (temp === "all") return true;
  if (item.price != null) {
    if (temp === "hot") return sectionId === "tea";
    return sectionId === "fizzy" || item.name === "Affogato";
  }
  return temp === "hot" ? item.hot != null : item.iced != null;
}

/** Hot and iced prices stay aligned; non-matching temperature dims when focused. */
function Price({ item, tempFocus }: { item: DrinkItem; tempFocus: TempFocus }) {
  if (item.price != null) {
    return <span className="tabular-nums">{formatPrice(item.price)}</span>;
  }

  const hotMuted = tempFocus === "iced" ? "opacity-30" : "";
  const icedMuted = tempFocus === "hot" ? "opacity-30" : "";

  return (
    <span className="price-pair">
      <span className={`transition-opacity ${hotMuted}`}>
        {item.hot != null && (
          <>
            <small>Hot</small> {formatPrice(item.hot)}
          </>
        )}
      </span>
      <span aria-hidden="true" className="price-slash">
        {item.hot != null && item.iced != null && "/"}
      </span>
      <span className={`transition-opacity ${icedMuted}`}>
        {item.iced != null && (
          <>
            <small>Iced</small> {formatPrice(item.iced)}
          </>
        )}
      </span>
    </span>
  );
}

/**
 * Minimalist Drinks menu with clean category tabs, Hot/Iced focus, gentle
 * liquid drift (via Float), and understated cake-pairing links.
 */
export function DrinksMenu({ sections }: DrinksMenuProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [tempFocus, setTempFocus] = useState<TempFocus>("all");
  const [highlightedDrink, setHighlightedDrink] = useState<string | null>(null);
  const rowRefs = useRef<Map<string, HTMLLIElement>>(new Map());

  // Respond to "See in Drinks ↑" clicks coming from a Cake Tasting Card.
  useEffect(() => {
    let scrollTimer = 0;
    let clearTimer = 0;

    const unsubscribe = onFocusDrink((drinkName) => {
      setActiveCategory("all");
      setTempFocus("all");
      setHighlightedDrink(drinkName);

      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);

      const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
      scrollTimer = window.setTimeout(() => {
        rowRefs.current.get(drinkName)?.scrollIntoView({
          behavior: reducedMotion ? "instant" : "smooth",
          block: "center",
        });
      }, reducedMotion ? 0 : 380);

      clearTimer = window.setTimeout(() => {
        setHighlightedDrink((current) => (current === drinkName ? null : current));
      }, 3000);
    });

    return () => {
      window.clearTimeout(scrollTimer);
      window.clearTimeout(clearTimer);
      unsubscribe();
    };
  }, []);

  const setRowRef = (drinkName: string) => (el: HTMLLIElement | null) => {
    if (el) rowRefs.current.set(drinkName, el);
    else rowRefs.current.delete(drinkName);
  };

  const renderSection = (section: DrinkSection) => (
    <div key={section.id}>
      <h3 className="font-display border-b border-[var(--liquid-line)] pb-3 text-[clamp(24px,2.3vw,30px)] font-normal">
        {section.title}
      </h3>
      {section.description && (
        <p className="mt-2 text-base text-latte-ink">{section.description}</p>
      )}
      <ul className="mt-2">
        {section.items.map((item) => {
          const available = matchesTemperature(item, section.id, tempFocus);
          const pairedCakes = getCakesPairedWithDrink(item.name);
          const isHighlighted = highlightedDrink === item.name;

          return (
            <li
              key={item.name}
              ref={setRowRef(item.name)}
              className={`float-row -mx-2 rounded-lg px-2 py-2.5 transition-opacity duration-200 ${
                available ? "opacity-100" : "opacity-30"
              } ${isHighlighted ? "drink-row--highlight" : ""}`}
            >
              <div className="flex items-baseline gap-2.5 text-[19px]">
                <span className="sm:shrink-0">
                  {item.name}
                  {item.note && item.note !== "Hot only" && (
                    <span className="drink-tag ml-2">{item.note.toLowerCase()}</span>
                  )}
                </span>
                <span className="drink-leader" aria-hidden="true" />
                <Price item={item} tempFocus={tempFocus} />
              </div>

              {pairedCakes.length > 0 && (
                <div className="mt-0.5 flex flex-wrap gap-x-3">
                  {pairedCakes.map((cake) => (
                    <button
                      key={cake.name}
                      type="button"
                      onClick={() => dispatchInspectCake(cake.name)}
                      className="cursor-pointer text-[13px] text-latte-ink/85 underline-offset-4 transition-colors hover:text-espresso hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso"
                    >
                      ↳ pairs with {cake.name}
                    </button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );

  const [blackWhite, signature, fizzy, tea] = sections;
  const focusedSection = sections.find((s) => s.id === activeCategory);

  return (
    <div className="mt-8">
      {/* Minimal typographic filter bar */}
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3 border-y border-[var(--liquid-line)] py-3.5">
        <div
          className="flex flex-wrap gap-x-5 gap-y-2"
          role="group"
          aria-label="Filter drinks by category"
        >
          <CategoryTab
            active={activeCategory === "all"}
            onClick={() => setActiveCategory("all")}
          >
            All
          </CategoryTab>
          {sections.map((section) => (
            <CategoryTab
              key={section.id}
              active={activeCategory === section.id}
              onClick={() => setActiveCategory(section.id)}
            >
              {section.title}
            </CategoryTab>
          ))}
        </div>

        <div
          className="flex items-center gap-4 text-sm"
          role="group"
          aria-label="Highlight by serving temperature"
        >
          {(
            [
              { id: "all", label: "All" },
              { id: "hot", label: "Hot" },
              { id: "iced", label: "Iced" },
            ] as const
          ).map((option) => (
            <button
              key={option.id}
              type="button"
              aria-pressed={tempFocus === option.id}
              onClick={() => setTempFocus(option.id)}
              className={`min-h-8 cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso ${
                tempFocus === option.id
                  ? "text-espresso underline underline-offset-4"
                  : "text-espresso/50 hover:text-espresso"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Menu grid */}
      {focusedSection ? (
        <Float key={activeCategory} className="mt-12 max-w-[680px]">
          {renderSection(focusedSection)}
        </Float>
      ) : (
        <Float
          key="all"
          className="mt-12 grid gap-x-12 gap-y-14 lg:grid-cols-3"
        >
          {renderSection(blackWhite)}
          {renderSection(signature)}
          <div className="flex flex-col gap-14">
            {renderSection(fizzy)}
            {renderSection(tea)}
          </div>
        </Float>
      )}
    </div>
  );
}

function CategoryTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-9 cursor-pointer text-base transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso ${
        active
          ? "text-espresso underline decoration-2 underline-offset-[6px]"
          : "text-espresso/55 hover:text-espresso"
      }`}
    >
      {children}
    </button>
  );
}
