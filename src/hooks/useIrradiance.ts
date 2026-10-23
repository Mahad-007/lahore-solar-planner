"use client";

import { useEffect, useState } from "react";
import type { IrradianceData, IrradianceMode } from "@/lib/types";

type Params = { mode: IrradianceMode; tilt: number; azimuth: number; month: number };

type Result = { key: string; attempt: number; data?: IrradianceData; error?: string };

export type IrradianceState = {
  /** Latest data for the current mode; may be for older tilt/orientation while refreshing. */
  data: IrradianceData | null;
  status: "loading" | "ready" | "error";
  error: string | null;
  isRefreshing: boolean;
  retry: () => void;
};

export const useIrradiance = ({ mode, tilt, azimuth, month }: Params): IrradianceState => {
  const key = `${mode}|${tilt}|${azimuth}|${mode === "typical" ? month : ""}`;
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [lastGood, setLastGood] = useState<IrradianceData | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ mode, tilt: String(tilt), azimuth: String(azimuth) });
    if (mode === "typical") query.set("month", String(month));

    fetch(`/api/irradiance?${query}`, { signal: controller.signal })
      .then(async (res) => {
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.error ?? `Request failed (${res.status})`);
        return body as IrradianceData;
      })
      .then((data) => {
        setResult({ key, attempt, data });
        setLastGood(data);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        const message = err instanceof Error ? err.message : "Something went wrong.";
        setResult({ key, attempt, error: message });
      });

    return () => controller.abort();
  }, [key, attempt, mode, tilt, azimuth, month]);

  const settled = result?.key === key && result.attempt === attempt ? result : null;
  const status = settled ? (settled.error ? "error" : "ready") : "loading";
  const data = lastGood?.mode === mode ? lastGood : null;

  return {
    data,
    status,
    error: settled?.error ?? null,
    isRefreshing: status === "loading" && data !== null,
    retry: () => setAttempt((a) => a + 1),
  };
};
