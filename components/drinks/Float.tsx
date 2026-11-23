"use client";

import { animate, utils, type JSAnimation } from "animejs";
import { useEffect, useRef, type ReactNode } from "react";

/**
 * Wraps the menu and lets every `.float-row` inside drift very slowly, as if
 * floating in liquid. Whole rows move together, so names and prices stay aligned.
 * Off for reduced motion, paused whenever the menu is off-screen.
 */
export function Float({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rows = Array.from(root.querySelectorAll<HTMLElement>(".float-row"));
    const anim: JSAnimation = animate(rows, {
      y: () => utils.random(-3, -1),
      x: () => utils.random(-1.5, 1.5, 1),
      duration: () => utils.random(5200, 9000),
      delay: () => utils.random(0, 2500),
      loop: true,
      alternate: true,
      ease: "inOutSine",
      autoplay: false,
    });
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? anim.resume() : anim.pause()));
    io.observe(root);
    return () => {
      io.disconnect();
      anim.revert();
    };
  }, []);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
