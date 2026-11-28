"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { CheckIcon, CopyIcon } from "@/components/ContactIcons";
import type { HoursRow } from "@/lib/hours/format";
import type { DayKey } from "@/lib/hours/types";

const emptySubscribe = () => () => {};

const WEEKDAY_TO_KEY: Record<string, DayKey> = {
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
  Sun: "sun",
};

const WEEKDAY_SHORT: Record<DayKey, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

/** Quiet inline Copy Address action styled for the dark espresso Find Us section. */
export function CopyAddressButton({ address }: { address: string }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2200);
    return () => window.clearTimeout(id);
  }, [copied]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = address;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
      } finally {
        textarea.remove();
      }
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-live="polite"
      className="mt-2 inline-flex min-h-10 cursor-pointer items-center gap-2 text-sm text-milk/75 underline decoration-milk/35 decoration-1 underline-offset-4 transition-colors hover:text-milk hover:decoration-milk focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-led"
    >
      {copied ? <CheckIcon /> : <CopyIcon />}
      <span>{copied ? "Address copied" : "Copy address"}</span>
    </button>
  );
}

function useTodayInTimezone(timezone: string): DayKey | null {
  return useSyncExternalStore(
    emptySubscribe,
    () => {
      const shortWeekday = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        weekday: "short",
      }).format(new Date());
      return WEEKDAY_TO_KEY[shortWeekday] ?? null;
    },
    () => null,
  );
}

/**
 * Displays the summarized opening hours and notes today's weekday client-side
 * in the cafe's timezone so prerendered pages never show a stale weekday.
 */
export function HoursSchedule({
  rows,
  timezone,
}: {
  rows: HoursRow[];
  timezone: string;
}) {
  const today = useTodayInTimezone(timezone);

  return (
    <dl className="space-y-1.5">
      {rows.map((row) => {
        const isToday = today !== null && row.days.includes(today);
        return (
          <div key={row.label} className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <dt className="min-w-14 text-milk">{row.label}</dt>
            <dd className="tabular-nums text-milk/90">{row.text}</dd>
            {isToday && (
              <span className="text-xs uppercase tracking-[0.12em] text-led/75">
                · Today ({WEEKDAY_SHORT[today]})
              </span>
            )}
          </div>
        );
      })}
    </dl>
  );
}
