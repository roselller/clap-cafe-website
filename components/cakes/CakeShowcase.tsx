"use client";

import { createRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CakeItem } from "@/lib/cafe";
import { onInspectCake } from "@/lib/menu-events";
import { CakeDome } from "./CakeDome";
import { CakeInspector } from "./CakeInspector";

interface CakeShowcaseProps {
  cakes: CakeItem[];
}

/**
 * Clean, airy studio gallery of all 9 daily cakes.
 * Manages selection state, Tasting Card inspection, focus restoration, and
 * incoming pairing jumps from the Drinks section.
 */
export function CakeShowcase({ cakes }: CakeShowcaseProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const lastOpenedIndexRef = useRef<number | null>(null);

  const buttonRefs = useMemo(
    () => cakes.map(() => createRef<HTMLButtonElement>()),
    [cakes],
  );

  const openCake = useCallback((index: number) => {
    lastOpenedIndexRef.current = index;
    setSelectedIndex(index);
  }, []);

  const closeInspector = useCallback(() => {
    const restoreIndex = lastOpenedIndexRef.current;
    setSelectedIndex(null);
    if (restoreIndex !== null) {
      requestAnimationFrame(() => {
        buttonRefs[restoreIndex]?.current?.focus();
      });
    }
  }, [buttonRefs]);

  // Open the requested cake's Tasting Card when jumping from a drink pairing link.
  useEffect(() => {
    let timer = 0;
    const unsubscribe = onInspectCake((cakeName) => {
      const targetIndex = cakes.findIndex((cake) => cake.name === cakeName);
      if (targetIndex < 0) return;

      window.clearTimeout(timer);
      const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
      timer = window.setTimeout(
        () => openCake(targetIndex),
        reducedMotion ? 0 : 480,
      );
    });

    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [cakes, openCake]);

  return (
    <>
      <ul
        aria-label="Daily cakes"
        className="mx-auto mt-12 grid max-w-[1160px] grid-cols-2 gap-x-4 gap-y-10 px-6 sm:mt-14 sm:gap-x-8 sm:px-10 md:grid-cols-3 md:gap-x-10 md:gap-y-14"
      >
        {cakes.map((cake, index) => (
          <CakeDome
            key={cake.name}
            cake={cake}
            selected={selectedIndex === index}
            buttonRef={buttonRefs[index]}
            onSelect={() => openCake(index)}
          />
        ))}
      </ul>

      {selectedIndex !== null && (
        <CakeInspector
          cakes={cakes}
          index={selectedIndex}
          onClose={closeInspector}
          onSelectIndex={openCake}
        />
      )}
    </>
  );
}
