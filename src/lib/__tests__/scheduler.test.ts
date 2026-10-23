import { describe, expect, it } from "vitest";
import { durationFractions, planDay } from "../scheduler";
import type { Appliance } from "../types";

// Solar output peaking at 12:00–13:00.
const pv = Array.from({ length: 24 }, (_, h) => Math.max(0, 4 - Math.abs(h - 12) * 0.8));
const app = (id: string, kw: number, hours: number): Appliance => ({ id, name: id, kw, hours });

describe("durationFractions", () => {
  it("splits partial hours into a trailing fraction", () => {
    expect(durationFractions(2.5)).toEqual([1, 1, 0.5]);
    expect(durationFractions(0.25)).toEqual([0.25]);
  });
});

describe("planDay", () => {
  it("puts a one-hour load in the peak surplus hour", () => {
    const plan = planDay(pv, 0.5, [app("washer", 0.5, 1)]);
    expect(plan.placements[0].start).toBe(12);
    expect(plan.placements[0].coverage).toBe(1);
  });

  it("never allocates more solar than the surplus", () => {
    const plan = planDay(pv, 0.5, [app("ac", 1.5, 4), app("geyser", 2, 1), app("motor", 0.75, 1)]);
    for (const row of plan.hours) {
      const surplus = Math.max(row.pvKw - row.baseKw, 0);
      const solarToAppliances = Math.min(row.applianceKw, surplus);
      expect(solarToAppliances).toBeLessThanOrEqual(surplus + 1e-9);
    }
    const allocated = plan.placements.reduce((s, p) => s + p.solarKwh, 0);
    const totalSurplus = pv.reduce((s, p) => s + Math.max(p - 0.5, 0), 0);
    expect(allocated).toBeLessThanOrEqual(totalSurplus + 1e-9);
  });

  it("reports partial coverage and the reason when demand exceeds supply", () => {
    const plan = planDay(pv, 0.5, [app("big", 6, 1)]);
    expect(plan.placements[0].coverage).toBeLessThan(1);
    expect(plan.placements[0].limitedBy).toBe("power");
    expect(plan.placements[0].gridKwh).toBeGreaterThan(0);
  });

  it("does not schedule before the earliest slot", () => {
    const plan = planDay(pv, 0.5, [app("washer", 0.5, 1)], 14);
    expect(plan.placements[0].start).toBeGreaterThanOrEqual(14);
  });

  it("flags appliances when no solar is left", () => {
    const plan = planDay(pv, 0.5, [app("washer", 0.5, 1)], 20);
    expect(plan.placements[0].status).toBe("no-solar");
    expect(plan.placements[0].start).toBeNull();
  });

  it("accounts energy consistently", () => {
    const plan = planDay(pv, 0.5, [app("ac", 1.3, 4), app("iron", 1, 0.5)]);
    expect(plan.loadKwh).toBeCloseTo(0.5 * 24 + 1.3 * 4 + 0.5, 6);
    expect(plan.solarUsedKwh + plan.gridKwh).toBeCloseTo(plan.loadKwh, 6);
    expect(plan.solarUsedKwh + plan.unusedSolarKwh).toBeCloseTo(plan.generationKwh, 6);
  });
});
