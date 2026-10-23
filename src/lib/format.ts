import { LAHORE } from "./solar";

const pad = (n: number): string => String(n).padStart(2, "0");

/** 11.5 → "11:30". Rounds to the nearest minute. */
export const clock = (t: number): string => {
  const totalMinutes = Math.round(t * 60);
  return `${pad(Math.floor(totalMinutes / 60))}:${pad(totalMinutes % 60)}`;
};

/** 1.5 → "1 h 30 min", 0.25 → "15 min". */
export const duration = (hours: number): string => {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h === 0) return `${m} min`;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
};

export const kwh = (value: number): string =>
  `${value >= 10 ? value.toFixed(0) : value.toFixed(1)} kWh`;

export const kw = (value: number): string => `${value.toFixed(value < 1 ? 2 : 1)} kW`;

export const percent = (share: number): string => `${Math.round(share * 100)}%`;

export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** Current wall-clock time in Lahore. */
export const lahoreNow = (): { date: string; hour: number; minute: number; month: number } => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: LAHORE.timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "0";
  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
    minute: Number(get("minute")),
    month: Number(get("month")),
  };
};

/** "2026-10-24" → { short: "Sat", long: "Saturday, 24 October" }. */
export const dayLabels = (isoDate: string): { short: string; long: string } => {
  const date = new Date(`${isoDate}T12:00:00Z`);
  return {
    short: date.toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" }),
    long: date.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }),
  };
};
