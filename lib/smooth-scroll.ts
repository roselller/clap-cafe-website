import { animate, cubicBezier } from "animejs";

/**
 * Nav-bar easing: quick off the mark, then a long, soft landing. A cubic Bézier,
 * (0.25, 0.8, 0.25, 1), so velocity is continuous (no jolt at the start) and is
 * exactly zero at the end.
 */
const [X1, Y1, X2, Y2] = [0.25, 0.8, 0.25, 1];
const bez = (a: number, b: number, c: number, t: number) =>
  3 * a * (1 - t) * (1 - t) * t + 3 * b * (1 - t) * t * t + t * t * t * c;
export const navEase = (x: number) => {
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (bez(X1, X2, 1, mid) < x) lo = mid;
    else hi = mid;
  }
  return bez(Y1, Y2, 1, (lo + hi) / 2);
};

/**
 * The scroll down through the hero's pour: it eases out slowly, speeds up through the middle
 * and glides to a stop (an S-curve). Used for the hero's arrow and for the Drinks icon when
 * you are still in the hero.
 */
const pourEase = cubicBezier(0.62, 0.02, 0.2, 1);
const POUR_MS = 3400;

let running: ReturnType<typeof animate> | null = null;

function cancel() {
  running?.cancel();
  running = null;
}

/** Animates the page to `#id`. Instant when the visitor prefers reduced motion. */
export function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  const to = id === "top" ? 0 : Math.round(target.getBoundingClientRect().top + window.scrollY);
  const from = window.scrollY;
  const finish = () => {
    history.pushState(null, "", `#${id}`);
    target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  };

  cancel();
  if (matchMedia("(prefers-reduced-motion: reduce)").matches || from === to) {
    window.scrollTo({ top: to, behavior: "instant" });
    finish();
    return;
  }

  const state = { y: from };
  // heading down to the menu from inside the hero: take the whole pour on the S-curve
  const pour = id === "drinks" && from < to;
  const duration = pour
    ? Math.min(POUR_MS, Math.max(1400, (POUR_MS * (to - from)) / to))
    : Math.min(2200, Math.max(900, 600 + Math.abs(to - from) * 0.4));
  const stop = () => {
    cancel();
    window.removeEventListener("wheel", stop);
    window.removeEventListener("touchstart", stop);
    window.removeEventListener("keydown", stop);
  };
  // the visitor taking over the scroll always wins
  window.addEventListener("wheel", stop, { passive: true });
  window.addEventListener("touchstart", stop, { passive: true });
  window.addEventListener("keydown", stop);

  running = animate(state, {
    y: to,
    duration,
    ease: pour ? pourEase : navEase,
    onUpdate: () => window.scrollTo({ top: state.y, behavior: "instant" }),
    onComplete: () => {
      stop();
      window.scrollTo({ top: to, behavior: "instant" });
      finish();
    },
  });
}
