"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Google Maps embed, mounted only when it's about to scroll into view so it never
 * costs the initial load. A flat placeholder holds the space (no layout shift).
 */
export function LazyMap({ query, title }: { query: string; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShow(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative min-h-[360px] overflow-hidden rounded-2xl border border-white/15 bg-case-base shadow-[0_16px_44px_rgb(0_0_0/0.35)] md:min-h-[520px]"
    >
      {show ? (
        <iframe
          title={title}
          src={`https://www.google.com/maps?q=${encodeURIComponent(query)}&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center gap-3 text-milk">
          <svg width="32" height="42" viewBox="0 0 28 36" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
            <path d="M14 34S3 22 3 13a11 11 0 0 1 22 0c0 9-11 21-11 21z" fill="#ec7e91" />
            <circle cx="14" cy="13" r="4" fill="#fff" />
          </svg>
          <span className="text-lg font-medium">We are here</span>
        </div>
      )}
    </div>
  );
}
