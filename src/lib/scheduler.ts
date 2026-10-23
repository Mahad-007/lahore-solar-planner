import { displayName } from "./presets";
import type { Appliance } from "./types";

const EPS = 1e-6;

export type LimitReason = "power" | "duration" | "shared" | null;

export type Placement = {
  appliance: Appliance;
  status: "scheduled" | "no-solar" | "no-time";
  /** Start slot (fractional end = start + hours). Null when not scheduled. */
  start: number | null;
  energyKwh: number;
  solarKwh: number;
  gridKwh: number;
  /** Share of this appliance's energy covered by solar, 0–1. */
  coverage: number;
  /** Why coverage is below 100%, when it is. */
  limitedBy: LimitReason;
};

export type HourRow = {
  hour: number;
  pvKw: number;
  baseKw: number;
  applianceKw: number;
  running: { id: string; name: string; kw: number }[];
};

export type DayPlan = {
  hours: HourRow[];
  placements: Placement[];
  generationKwh: number;
  loadKwh: number;
  solarUsedKwh: number;
  gridKwh: number;
  unusedSolarKwh: number;
  /** Share of the day's load covered by solar, 0–1. */
  solarShare: number;
  peakHour: number | null;
  /** First and last slot where solar exceeds the always-on load. */
  surplusWindow: { start: number; end: number } | null;
};

/** Per-slot run fractions: 2.5 h → [1, 1, 0.5]. */
export const durationFractions = (hours: number): number[] => {
  const fractions: number[] = [];
  let left = hours;
  while (left > EPS) {
    fractions.push(Math.min(left, 1));
    left -= 1;
  }
  return fractions;
};

const limitReason = (appliance: Appliance, surplus: number[], remaining: number[]): LimitReason => {
  const peak = Math.max(...surplus);
  if (peak + EPS < appliance.kw) return "power";
  const sunnySlots = surplus.filter((s) => s > EPS).length;
  if (sunnySlots + EPS < appliance.hours) return "duration";
  return remaining.some((r, i) => r + EPS < surplus[i]) ? "shared" : "duration";
};

/**
 * Greedy day planner. Largest-energy appliances pick first; each takes the
 * contiguous window that covers the most of its energy from solar surplus,
 * breaking ties by the window with the most spare surplus (a cloud buffer).
 */
export const planDay = (
  pv: number[],
  baseKw: number,
  appliances: Appliance[],
  earliestSlot = 0,
): DayPlan => {
  const surplus = pv.map((p) => Math.max(p - baseKw, 0));
  const remaining = [...surplus];
  const hours: HourRow[] = pv.map((pvKw, hour) => ({
    hour,
    pvKw,
    baseKw,
    applianceKw: 0,
    running: [],
  }));

  const ordered = appliances
    .filter((a) => a.kw > 0 && a.hours > 0)
    .sort((a, b) => b.kw * b.hours - a.kw * a.hours);

  const placements: Placement[] = ordered.map((appliance) => {
    const energyKwh = appliance.kw * appliance.hours;
    const fractions = durationFractions(appliance.hours);
    let best: { start: number; solar: number; cushion: number } | null = null;

    for (let start = earliestSlot; start + fractions.length <= pv.length; start++) {
      let solar = 0;
      let cushion = 0;
      fractions.forEach((f, k) => {
        const available = remaining[start + k];
        solar += f * Math.min(available, appliance.kw);
        cushion += available;
      });
      const better =
        !best ||
        solar > best.solar + EPS ||
        (Math.abs(solar - best.solar) <= EPS && cushion > best.cushion + EPS);
      if (better) best = { start, solar, cushion };
    }

    if (!best) {
      return { appliance, status: "no-time", start: null, energyKwh, solarKwh: 0, gridKwh: energyKwh, coverage: 0, limitedBy: "duration" };
    }
    if (best.solar <= EPS) {
      return { appliance, status: "no-solar", start: null, energyKwh, solarKwh: 0, gridKwh: energyKwh, coverage: 0, limitedBy: null };
    }

    const chosen = best;
    const reason = chosen.solar + EPS < energyKwh ? limitReason(appliance, surplus, remaining) : null;
    fractions.forEach((f, k) => {
      const slot = chosen.start + k;
      remaining[slot] = Math.max(remaining[slot] - f * appliance.kw, 0);
      hours[slot].applianceKw += f * appliance.kw;
      hours[slot].running.push({ id: appliance.id, name: displayName(appliance), kw: f * appliance.kw });
    });

    return {
      appliance,
      status: "scheduled",
      start: chosen.start,
      energyKwh,
      solarKwh: chosen.solar,
      gridKwh: energyKwh - chosen.solar,
      coverage: Math.min(chosen.solar / energyKwh, 1),
      limitedBy: reason,
    };
  });

  const generationKwh = pv.reduce((sum, p) => sum + p, 0);
  const baseSolarKwh = pv.reduce((sum, p) => sum + Math.min(p, baseKw), 0);
  const applianceKwh = placements.reduce((sum, p) => sum + p.energyKwh, 0);
  const applianceSolarKwh = placements.reduce((sum, p) => sum + p.solarKwh, 0);
  const loadKwh = baseKw * pv.length + applianceKwh;
  const solarUsedKwh = baseSolarKwh + applianceSolarKwh;

  const peak = Math.max(...pv);
  const sunny = surplus.map((s, i) => (s > EPS ? i : -1)).filter((i) => i >= 0);

  placements.sort((a, b) => (a.start ?? Infinity) - (b.start ?? Infinity));

  return {
    hours,
    placements,
    generationKwh,
    loadKwh,
    solarUsedKwh,
    gridKwh: Math.max(loadKwh - solarUsedKwh, 0),
    unusedSolarKwh: Math.max(generationKwh - solarUsedKwh, 0),
    solarShare: loadKwh > 0 ? solarUsedKwh / loadKwh : 0,
    peakHour: peak > EPS ? pv.indexOf(peak) : null,
    surplusWindow: sunny.length ? { start: sunny[0], end: sunny[sunny.length - 1] + 1 } : null,
  };
};
