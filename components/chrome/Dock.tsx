"use client";

import { animate } from "animejs";
import { useEffect, useState } from "react";
import { scrollToSection } from "@/lib/smooth-scroll";

/** Google Material Symbols (outlined, 24px), filled in white on the coloured tile. */
const ITEMS = [
  { id: "top", label: "Home", bg: "#2a1a12", icon: "M6,19H9V13h6v6h3V10L12,5.5L6,10v9ZM4,21V9l8-6l8,6V21H13V15H11v6H4Zm8-8.75Z" },
  { id: "drinks", label: "Drinks", bg: "#a2704a", icon: "M11,18q-2.92,0-4.96-2.04T4,11V5Q4,4.17 4.59,3.59T6,3H18.5q1.45,0 2.48,1.02T22,6.5T20.98,8.98T18.5,10H18v1q0,2.92-2.04,4.96T11,18ZM6,8H16V5H6V8Zm5,8q2.08,0 3.54-1.46T16,11V10H6v1q0,2.07 1.46,3.54T11,16Zm7-8h0.5q0.63,0 1.06-0.44T20,6.5T19.56,5.44T18.5,5H18V8ZM4,21V19H20v2H4Zm7-11Z" },
  { id: "cakes", label: "Cakes", bg: "#d85f76", icon: "M4,22q-0.42,0-0.71-0.29Q3,21.43 3,21V16q0-0.83 0.59-1.41T5,14V10Q5,9.17 5.59,8.59T7,8h4V6.55q-0.45-0.3-0.72-0.73T10,4.8q0-0.38 0.15-0.74T10.6,3.4L12,2l1.4,1.4q0.3,0.3 0.45,0.66Q14,4.42 14,4.8q0,0.6-0.27,1.03T13,6.55V8h4q0.82,0 1.41,0.59T19,10v4q0.83,0 1.41,0.59T21,16v5q0,0.43-0.29,0.71T20,22H4Zm3-8H17V10H7v4ZM5,20H19V16H5v4Zm2-6H17H7ZM5,20H19H5Zm14-6H5H19Z" },
  { id: "find", label: "Find us", bg: "#3d7bc4", icon: "M13.41,11.41Q14,10.83 14,10q0-0.83-0.59-1.41T12,8T10.59,8.59T10,10t0.59,1.41T12,12t1.41-0.59ZM12,19.35q3.05-2.8 4.53-5.09Q18,11.98 18,10.2q0-2.73-1.74-4.46Q14.53,4 12,4T7.74,5.74Q6,7.47 6,10.2q0,1.78 1.48,4.06T12,19.35ZM12,22q-4.02-3.43-6.01-6.36T4,10.2Q4,6.45 6.41,4.22T12,2t5.59,2.22T20,10.2q0,2.5-1.99,5.44Q16.03,18.58 12,22Zm0-12Z" },
] as const;

/** Frosted iPhone-style dock. Icons jiggle on hover/focus; the current section gets a dot. */
export function Dock() {
  const [active, setActive] = useState<string>("top");

  useEffect(() => {
    // The active section is the last one whose top has passed the middle of the screen (or the
    // last one once you reach the bottom). Reading positions on scroll, instead of watching
    // sections enter and leave, stays right when sections overlap (the menu is pulled up
    // under the hero) and when you scroll back up.
    const targets = ITEMS.map((i) => document.getElementById(i.id));
    let frame = 0;
    const update = () => {
      frame = 0;
      const probe = window.innerHeight * 0.5;
      let current: string = ITEMS[0].id;
      targets.forEach((el, i) => {
        if (el && el.getBoundingClientRect().top <= probe) current = ITEMS[i].id;
      });
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
      if (atBottom) current = ITEMS[ITEMS.length - 1].id;
      setActive(current);
    };
    const queue = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", queue);
      window.removeEventListener("resize", queue);
    };
  }, []);

  const jiggle = (el: HTMLElement) => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const app = el.querySelector<HTMLElement>(".dock-app");
    if (app) animate(app, { rotate: [0, -8, 7, -4, 0], duration: 500, ease: "inOutSine" });
  };

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[max(14px,env(safe-area-inset-bottom))]">
      <nav
        aria-label="Main"
        className="ui-chrome pointer-events-auto flex gap-3 rounded-[28px] border border-white/65 bg-milk/75 p-2.5 shadow-[0_10px_30px_rgb(27_16_10/0.22)] ring-1 ring-espresso/10 backdrop-blur-xl backdrop-saturate-150 sm:gap-5 sm:p-3"
      >
        {ITEMS.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            aria-label={item.label}
            aria-current={active === item.id ? "location" : undefined}
            className="dock-link transition-transform active:scale-95"
            onClick={(e) => {
              e.preventDefault();
              scrollToSection(item.id);
            }}
            onMouseEnter={(e) => jiggle(e.currentTarget)}
            onFocus={(e) => jiggle(e.currentTarget)}
          >
            <span
              className="dock-app flex h-12 w-12 items-center justify-center rounded-[14px] shadow-[0_3px_8px_rgb(0_0_0/0.16)] sm:h-14 sm:w-14 sm:rounded-2xl"
              style={{ background: item.bg }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24" fill="#fff" aria-hidden="true">
                <path d={item.icon} />
              </svg>
            </span>
            <span
              aria-hidden="true"
              className={`mx-auto mt-1.5 block h-1.5 rounded-full bg-espresso transition-all ${active === item.id ? "w-3 opacity-100" : "w-1.5 opacity-0"}`}
            />
            <span className="dock-tip" aria-hidden="true">
              {item.label}
            </span>
          </a>
        ))}
      </nav>
    </div>
  );
}
