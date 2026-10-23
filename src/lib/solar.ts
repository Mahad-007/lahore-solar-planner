import type { OrientationId, Slot } from "./types";

export const LAHORE = {
  latitude: 31.5204,
  longitude: 74.3587,
  timezone: "Asia/Karachi",
} as const;

/** Open-Meteo azimuth convention: 0° = south, −90° = east, 90° = west. */
export const ORIENTATIONS: { id: OrientationId; label: string; azimuth: number }[] = [
  { id: "E", label: "East", azimuth: -90 },
  { id: "SE", label: "South-east", azimuth: -45 },
  { id: "S", label: "South", azimuth: 0 },
  { id: "SW", label: "South-west", azimuth: 45 },
  { id: "W", label: "West", azimuth: 90 },
];

export const azimuthFor = (orientation: OrientationId): number =>
  ORIENTATIONS.find((o) => o.id === orientation)?.azimuth ?? 0;

/** Nominal operating cell temperature of a typical mono-PERC module, °C. */
const NOCT_C = 45;
/** Power temperature coefficient of a typical mono-PERC module, per °C. */
const TEMP_COEFF = -0.0037;

export const cellTemperature = (airC: number, gti: number): number =>
  airC + ((NOCT_C - 20) / 800) * gti;

/** Output multiplier from cell heating; below 1 on hot, sunny Lahore afternoons. */
export const temperatureFactor = (airC: number, gti: number): number =>
  1 + TEMP_COEFF * (cellTemperature(airC, gti) - 25);

/** Average AC output over one slot, kW. Capped at the array's rated size. */
export const pvOutputKw = (kwp: number, slot: Slot, pr: number): number => {
  if (kwp <= 0 || slot.gti <= 0) return 0;
  const kw = kwp * (slot.gti / 1000) * pr * temperatureFactor(slot.temp, slot.gti);
  return Math.min(Math.max(kw, 0), kwp);
};

export const pvSeries = (kwp: number, slots: Slot[], pr: number): number[] =>
  slots.map((slot) => pvOutputKw(kwp, slot, pr));

/** Mean cloud cover across daylight slots, for the day's weather icon. */
export const daylightCloud = (slots: Slot[]): number => {
  const daylight = slots.filter((s) => s.gti > 20);
  if (daylight.length === 0) return 100;
  return daylight.reduce((sum, s) => sum + s.cloud, 0) / daylight.length;
};
