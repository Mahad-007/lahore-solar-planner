import type { Appliance, Settings } from "./types";

export type AppliancePreset = Omit<Appliance, "id"> & { key: string };

/** Typical Pakistani household heavy loads. Power is the average draw while running. */
export const APPLIANCE_PRESETS: AppliancePreset[] = [
  { key: "ac", name: "Inverter AC (1.5 ton)", kw: 1.3, hours: 4 },
  { key: "motor", name: "Water motor (1 HP)", kw: 0.75, hours: 1 },
  { key: "washer", name: "Washing machine", kw: 0.5, hours: 1 },
  { key: "iron", name: "Clothes iron", kw: 1, hours: 0.5 },
  { key: "geyser", name: "Electric geyser", kw: 2, hours: 1 },
  { key: "microwave", name: "Microwave", kw: 1.2, hours: 0.25 },
  { key: "ebike", name: "E-bike charger", kw: 0.4, hours: 3 },
];

export const displayName = (appliance: Pick<Appliance, "name">): string =>
  appliance.name.trim() || "Unnamed appliance";

export const PANEL_SIZES = [3, 5, 8, 10, 15];

export const DEFAULT_SETTINGS: Settings = {
  kwp: 5,
  orientation: "S",
  tilt: 30,
  pr: 0.8,
  baseKw: 0.6,
  appliances: [
    { id: "default-ac", name: "Inverter AC (1.5 ton)", kw: 1.3, hours: 4 },
    { id: "default-motor", name: "Water motor (1 HP)", kw: 0.75, hours: 1 },
    { id: "default-washer", name: "Washing machine", kw: 0.5, hours: 1 },
    { id: "default-iron", name: "Clothes iron", kw: 1, hours: 0.5 },
  ],
  mode: "forecast",
  month: null,
};

export const LIMITS = {
  kwp: { min: 0.5, max: 50 },
  tilt: { min: 0, max: 60 },
  pr: { min: 0.6, max: 0.95 },
  baseKw: { min: 0, max: 10 },
  applianceKw: { min: 0.05, max: 10 },
  applianceHours: { min: 0.25, max: 12 },
  maxAppliances: 12,
} as const;
