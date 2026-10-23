import { DEFAULT_SETTINGS, LIMITS } from "./presets";
import { ORIENTATIONS } from "./solar";
import type { Appliance, OrientationId, Settings } from "./types";

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

const num = (value: unknown, fallback: number, min: number, max: number): number =>
  typeof value === "number" && Number.isFinite(value) ? clamp(value, min, max) : fallback;

const parseAppliance = (raw: unknown): Appliance | null => {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, unknown>;
  if (typeof a.id !== "string" || typeof a.name !== "string") return null;
  return {
    id: a.id,
    name: a.name.slice(0, 40),
    kw: num(a.kw, 1, LIMITS.applianceKw.min, LIMITS.applianceKw.max),
    hours: num(a.hours, 1, LIMITS.applianceHours.min, LIMITS.applianceHours.max),
  };
};

/** Validates settings read from storage; any bad field falls back to its default. */
export const parseSettings = (raw: unknown): Settings | null => {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as Record<string, unknown>;
  const orientation = ORIENTATIONS.some((o) => o.id === s.orientation)
    ? (s.orientation as OrientationId)
    : DEFAULT_SETTINGS.orientation;
  const appliances = Array.isArray(s.appliances)
    ? s.appliances
        .map(parseAppliance)
        .filter((a): a is Appliance => a !== null)
        .slice(0, LIMITS.maxAppliances)
    : DEFAULT_SETTINGS.appliances;
  const month =
    typeof s.month === "number" && Number.isInteger(s.month) && s.month >= 1 && s.month <= 12
      ? s.month
      : null;

  return {
    kwp: num(s.kwp, DEFAULT_SETTINGS.kwp, LIMITS.kwp.min, LIMITS.kwp.max),
    orientation,
    tilt: Math.round(num(s.tilt, DEFAULT_SETTINGS.tilt, LIMITS.tilt.min, LIMITS.tilt.max)),
    pr: num(s.pr, DEFAULT_SETTINGS.pr, LIMITS.pr.min, LIMITS.pr.max),
    baseKw: num(s.baseKw, DEFAULT_SETTINGS.baseKw, LIMITS.baseKw.min, LIMITS.baseKw.max),
    appliances,
    mode: s.mode === "typical" ? "typical" : "forecast",
    month,
  };
};
