"use client";

import { useEffect, useState } from "react";
import { getOpenStatus, type OpenStatus } from "@/lib/hours/status";
import type { OpeningHours } from "@/lib/hours/types";

/**
 * "Open now / Closed", worked out in the cafe's own timezone. It is computed after
 * hydration (never on the server) so a cached page can't show a stale answer, and
 * it refreshes every minute.
 */
export function OpenBadge({ hours }: { hours: OpeningHours }) {
  const [status, setStatus] = useState<OpenStatus | null>(null);

  useEffect(() => {
    const tick = () => setStatus(getOpenStatus(hours));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [hours]);

  return (
    <p
      role="status"
      className={`inline-flex min-h-9 items-center gap-2 self-start rounded-full px-4 py-1.5 text-[15px] font-semibold ${
        status === null
          ? "invisible"
          : status.open
            ? "bg-[#e3eedb] text-[#245028]"
            : "bg-[#f5e0de] text-[#8a2828]"
      }`}
    >
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${status?.open ? "bg-[#2f7a3a]" : "bg-[#9e2f2f]"}`}
      />
      {status?.label ?? "Checking hours"}
    </p>
  );
}
