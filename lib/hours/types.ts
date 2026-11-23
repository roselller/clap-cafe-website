export type DayKey = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export const DAY_KEYS: DayKey[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

export const DAY_NAMES: Record<DayKey, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

/** "HH:MM" 24-hour, or null when closed all day. */
export type DayHours = [open: string, close: string] | null;

export interface OpeningHours {
  timezone: string;
  weekly: Record<DayKey, DayHours>;
}
