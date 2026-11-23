import { DAY_KEYS, type DayHours, type DayKey, type OpeningHours } from "./types";

const SHORT: Record<DayKey, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

/** "08:30" → "8:30am", "19:00" → "7pm" */
export function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 ? "pm" : "am";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}:${String(m).padStart(2, "0")}${suffix}`;
}

export function formatRange(d: DayHours): string {
  return d ? `${formatTime(d[0])} – ${formatTime(d[1])}` : "Closed";
}

export interface HoursRow {
  label: string;
  text: string;
  days: DayKey[];
  hours: DayHours;
}

/** Groups consecutive days that share the same hours: "Daily", "Mon–Fri", "Sat–Sun". */
export function summarizeHours(oh: OpeningHours): HoursRow[] {
  const rows: HoursRow[] = [];
  for (const day of DAY_KEYS) {
    const hours = oh.weekly[day];
    const last = rows[rows.length - 1];
    if (last && JSON.stringify(last.hours) === JSON.stringify(hours)) {
      last.days.push(day);
    } else {
      rows.push({ label: "", text: formatRange(hours), days: [day], hours });
    }
  }
  for (const r of rows) {
    r.label =
      r.days.length === 7
        ? "Daily"
        : r.days.length === 1
          ? SHORT[r.days[0]]
          : `${SHORT[r.days[0]]}–${SHORT[r.days[r.days.length - 1]]}`;
  }
  return rows;
}
