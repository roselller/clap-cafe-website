import { formatTime } from "./format";
import { DAY_KEYS, DAY_NAMES, type DayKey, type OpeningHours } from "./types";

export interface OpenStatus {
  open: boolean;
  /** e.g. "Open now · until 7pm" / "Closed · opens 8:30am" */
  label: string;
}

const WEEKDAY_TO_KEY: Record<string, DayKey> = {
  Mon: "mon",
  Tue: "tue",
  Wed: "wed",
  Thu: "thu",
  Fri: "fri",
  Sat: "sat",
  Sun: "sun",
};

const toMinutes = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
};

/** The current day and minute-of-day in the cafe's own timezone. */
function localNow(timezone: string, now: Date): { day: DayKey; minutes: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    day: WEEKDAY_TO_KEY[get("weekday")],
    minutes: (Number(get("hour")) % 24) * 60 + Number(get("minute")),
  };
}

/** Pure: same inputs, same answer. Worked out in the cafe's timezone, not the visitor's. */
export function getOpenStatus(oh: OpeningHours, now: Date = new Date()): OpenStatus {
  const { day, minutes } = localNow(oh.timezone, now);
  const today = oh.weekly[day];

  if (today && minutes >= toMinutes(today[0]) && minutes < toMinutes(today[1])) {
    return { open: true, label: `Open now · until ${formatTime(today[1])}` };
  }

  if (today && minutes < toMinutes(today[0])) {
    return { open: false, label: `Closed · opens ${formatTime(today[0])}` };
  }

  const start = DAY_KEYS.indexOf(day);
  for (let i = 1; i <= 7; i++) {
    const key = DAY_KEYS[(start + i) % 7];
    const hours = oh.weekly[key];
    if (hours) {
      const when = i === 1 ? "tomorrow" : DAY_NAMES[key];
      return { open: false, label: `Closed · opens ${when} ${formatTime(hours[0])}` };
    }
  }
  return { open: false, label: "Closed" };
}
