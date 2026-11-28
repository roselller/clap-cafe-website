"use client";

import { ArrowUpIcon } from "@/components/ContactIcons";
import { scrollToSection } from "@/lib/smooth-scroll";

/** Minimal inline button that glides back to the hero cup at the top of the page. */
export function BackToTopButton() {
  return (
    <button
      type="button"
      onClick={() => scrollToSection("top")}
      className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 text-sm text-espresso underline decoration-espresso/40 underline-offset-4 transition-colors hover:decoration-espresso focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-espresso"
    >
      <span>Back to top</span>
      <ArrowUpIcon />
    </button>
  );
}
