import { cacheLife } from "next/cache";
import { LAHORE } from "./solar";
import type { DaySeries, IrradianceData, Slot } from "./types";

const HOURLY_VARS = "global_tilted_irradiance,temperature_2m,cloud_cover";
const FORECAST_DAYS = 7;

type Hourly = {
  time: string[];
  global_tilted_irradiance: (number | null)[];
  temperature_2m: (number | null)[];
  cloud_cover: (number | null)[];
};

const pad = (n: number): string => String(n).padStart(2, "0");

const nextDate = (isoDate: string): string => {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
};

const fetchHourly = async (base: string, params: Record<string, string | number>): Promise<Hourly> => {
  const query = new URLSearchParams({
    latitude: String(LAHORE.latitude),
    longitude: String(LAHORE.longitude),
    timezone: LAHORE.timezone,
    hourly: HOURLY_VARS,
    ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])),
  });
  const res = await fetch(`${base}?${query}`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
  const json = (await res.json()) as { hourly?: Hourly };
  if (!json.hourly?.time?.length) throw new Error("Open-Meteo returned no hourly data");
  return json.hourly;
};

/**
 * Open-Meteo radiation is the mean over the *preceding* hour, so the value
 * stamped 13:00 belongs to 12:00–13:00. Re-key every day so slot h covers
 * h:00–(h+1):00, which is what a schedule needs.
 */
const toDays = (hourly: Hourly): DaySeries[] => {
  const index = new Map(hourly.time.map((t, i) => [t, i]));
  const dates = [...new Set(hourly.time.map((t) => t.slice(0, 10)))];

  return dates.map((date) => {
    const slots: Slot[] = Array.from({ length: 24 }, (_, hour) => {
      const stamp = hour < 23 ? `${date}T${pad(hour + 1)}:00` : `${nextDate(date)}T00:00`;
      // Past the end of the range (last day's 23:00 slot): night, so no sun; reuse the slot-start weather.
      const i = index.get(stamp);
      const weather = i ?? index.get(`${date}T${pad(hour)}:00`) ?? 0;
      return {
        hour,
        gti: i === undefined ? 0 : Math.max(hourly.global_tilted_irradiance[i] ?? 0, 0),
        temp: hourly.temperature_2m[weather] ?? 25,
        cloud: hourly.cloud_cover[weather] ?? 0,
      };
    });
    return { date, slots };
  });
};

export const getForecast = async (tilt: number, azimuth: number): Promise<IrradianceData> => {
  "use cache";
  cacheLife("hours");

  const hourly = await fetchHourly("https://api.open-meteo.com/v1/forecast", {
    tilt,
    azimuth,
    // One extra day so the last returned day has its 23:00–24:00 slot.
    forecast_days: FORECAST_DAYS + 1,
  });
  return {
    mode: "forecast",
    days: toDays(hourly).slice(0, FORECAST_DAYS),
    fetchedAt: new Date().toISOString(),
  };
};

/** Average hourly profile for one calendar month, from the ERA5 reanalysis archive. */
export const getTypicalDay = async (
  tilt: number,
  azimuth: number,
  month: number,
  year: number,
): Promise<IrradianceData> => {
  "use cache";
  cacheLife("weeks");

  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const hourly = await fetchHourly("https://archive-api.open-meteo.com/v1/archive", {
    tilt,
    azimuth,
    start_date: `${year}-${pad(month)}-01`,
    end_date: `${year}-${pad(month)}-${pad(lastDay)}`,
  });
  const days = toDays(hourly);
  const slots: Slot[] = Array.from({ length: 24 }, (_, hour) => {
    const mean = (pick: (s: Slot) => number) =>
      days.reduce((sum, d) => sum + pick(d.slots[hour]), 0) / days.length;
    return { hour, gti: mean((s) => s.gti), temp: mean((s) => s.temp), cloud: mean((s) => s.cloud) };
  });

  return {
    mode: "typical",
    days: [{ date: `${year}-${pad(month)}`, slots }],
    month,
    year,
    fetchedAt: new Date().toISOString(),
  };
};
