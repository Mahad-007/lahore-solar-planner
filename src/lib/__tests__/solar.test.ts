import { describe, expect, it } from "vitest";
import { pvOutputKw, pvSeries, temperatureFactor } from "../solar";
import type { Slot } from "../types";

const slot = (gti: number, temp = 25): Slot => ({ hour: 12, gti, temp, cloud: 0 });

describe("pvOutputKw", () => {
  it("is zero at night", () => {
    expect(pvOutputKw(5, slot(0), 0.8)).toBe(0);
  });

  it("scales linearly with panel size", () => {
    const small = pvOutputKw(3, slot(600, 20), 0.8);
    const large = pvOutputKw(6, slot(600, 20), 0.8);
    expect(large).toBeCloseTo(small * 2, 6);
  });

  it("never exceeds the rated size", () => {
    expect(pvOutputKw(5, slot(1400, -10), 0.95)).toBeLessThanOrEqual(5);
  });
});

describe("temperatureFactor", () => {
  it("derates output on a hot sunny afternoon", () => {
    expect(temperatureFactor(42, 900)).toBeLessThan(0.9);
  });

  it("is close to 1 at standard conditions", () => {
    // 1000 W/m² at NOCT-corrected ~-6 °C air gives a 25 °C cell.
    expect(temperatureFactor(25 - (25 / 800) * 1000, 1000)).toBeCloseTo(1, 6);
  });
});

describe("daily yield sanity", () => {
  it("lands in Lahore's late-October range for a 5 kWp south array", () => {
    // Clear-sky-like bell curve peaking near 850 W/m² on a 30° tilt.
    const slots = Array.from({ length: 24 }, (_, hour) => {
      const x = (hour + 0.5 - 12) / 3.4;
      return { hour, gti: hour >= 6 && hour <= 17 ? 850 * Math.exp(-x * x) : 0, temp: 28, cloud: 0 };
    });
    const total = pvSeries(5, slots, 0.8).reduce((a, b) => a + b, 0);
    expect(total).toBeGreaterThan(18);
    expect(total).toBeLessThan(30);
  });
});
