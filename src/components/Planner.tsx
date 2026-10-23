"use client";

import { ArrowDown, CalendarDays, CloudOff, Loader2, RotateCw } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useIrradiance } from "@/hooks/useIrradiance";
import { usePersistentState } from "@/hooks/usePersistentState";
import { MONTHS, dayLabels, lahoreNow } from "@/lib/format";
import { DEFAULT_SETTINGS, LIMITS, type AppliancePreset } from "@/lib/presets";
import { planDay } from "@/lib/scheduler";
import { parseSettings } from "@/lib/settings";
import { azimuthFor, daylightCloud, pvSeries } from "@/lib/solar";
import type { Appliance, IrradianceData, IrradianceMode, Settings } from "@/lib/types";
import { DayTabs } from "./DayTabs";
import { HourlyChart } from "./HourlyChart";
import { KpiRow } from "./KpiRow";
import { LoadsForm } from "./LoadsForm";
import { ScheduleList } from "./ScheduleList";
import { SystemForm } from "./SystemForm";
import { ThemeToggle } from "./ThemeToggle";
import { Card, SegmentedControl, Skeleton, focusRing } from "./ui";

const STORAGE_KEY = "sunplan:v1";

const newId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const Planner = () => {
  const [settings, setSettings] = usePersistentState<Settings>(STORAGE_KEY, DEFAULT_SETTINGS, parseSettings);
  const [selectedDay, setSelectedDay] = useState(0);

  const update = useCallback(
    (patch: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...patch })),
    [setSettings],
  );

  const handleModeChange = (mode: IrradianceMode) => {
    setSelectedDay(0);
    update(mode === "typical" ? { mode, month: settings.month ?? lahoreNow().month } : { mode });
  };

  const handleAdd = (preset: Omit<AppliancePreset, "key">) =>
    setSettings((prev) =>
      prev.appliances.length >= LIMITS.maxAppliances
        ? prev
        : { ...prev, appliances: [...prev.appliances, { id: newId(), ...preset }] },
    );

  const handleUpdate = (id: string, patch: Partial<Appliance>) =>
    setSettings((prev) => ({
      ...prev,
      appliances: prev.appliances.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    }));

  const handleRemove = (id: string) =>
    setSettings((prev) => ({ ...prev, appliances: prev.appliances.filter((a) => a.id !== id) }));

  const tilt = useDebouncedValue(settings.tilt, 350);
  const irradiance = useIrradiance({
    mode: settings.mode,
    tilt,
    azimuth: azimuthFor(settings.orientation),
    month: settings.month ?? 1,
  });

  const isSample = settings === DEFAULT_SETTINGS;

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-surface">
        <div className="flex items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span aria-hidden className="grid size-9 place-items-center rounded-lg bg-solar text-on-solar">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" fill="currentColor" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
              </svg>
            </span>
            <div>
              <p className="text-[15px] leading-tight font-semibold tracking-tight text-fg">
                Sunplan <span className="font-normal text-fg-subtle">Lahore</span>
              </p>
              <p className="hidden text-[13px] text-fg-muted sm:block">
                When to run heavy appliances on your own solar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://github.com/Mahad-007/lahore-solar-planner"
              className={`pressable rounded-lg px-3 py-2 text-sm font-medium text-fg-muted hover:bg-subtle hover:text-fg ${focusRing}`}
            >
              GitHub
            </a>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="grid w-full flex-1 gap-4 px-4 py-5 sm:px-6 sm:py-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:gap-6 lg:px-8 2xl:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
        <h1 className="sr-only">Lahore solar planner</h1>

        <div className="order-1 min-w-0 space-y-4 lg:order-2">
          <Card
            title={settings.mode === "forecast" ? "Your solar day" : "A typical day"}
            titleId="results-heading"
            description={
              settings.mode === "forecast"
                ? "7-day forecast for Lahore. Pick a day to plan it."
                : "Average hourly sunshine for the month, from the most recent complete records."
            }
            action={
              <div className="w-full sm:w-64">
                <SegmentedControl<IrradianceMode>
                  name="mode"
                  legend="Data source"
                  hideLegend
                  value={settings.mode}
                  onChange={handleModeChange}
                  options={[
                    { value: "forecast", label: "Forecast" },
                    { value: "typical", label: "Typical day" },
                  ]}
                />
              </div>
            }
          >
            {isSample && (
              <a
                href="#inputs"
                className={`mb-4 flex items-center justify-between gap-3 rounded-lg bg-accent-soft px-3 py-2.5 text-sm text-accent-text lg:hidden ${focusRing}`}
              >
                Showing a sample 5 kWp home. Enter your own system below.
                <ArrowDown aria-hidden className="size-4 shrink-0" />
              </a>
            )}

            {settings.mode === "typical" && (
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays aria-hidden className="size-4 text-fg-subtle" />
                <label htmlFor="month" className="text-sm font-medium text-fg">
                  Month
                </label>
                <select
                  id="month"
                  value={settings.month ?? 1}
                  onChange={(e) => update({ month: Number(e.target.value) })}
                  className={`h-9 rounded-lg border border-control bg-surface px-2.5 text-sm text-fg ${focusRing}`}
                >
                  {MONTHS.map((m, i) => (
                    <option key={m} value={i + 1}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <Results
              data={irradiance.data}
              status={irradiance.status}
              error={irradiance.error}
              isRefreshing={irradiance.isRefreshing}
              onRetry={irradiance.retry}
              settings={settings}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
          </Card>
        </div>

        <div id="inputs" className="order-2 min-w-0 scroll-mt-4 space-y-4 lg:order-1">
          <SystemForm settings={settings} onChange={update} />
          <LoadsForm
            baseKw={settings.baseKw}
            appliances={settings.appliances}
            onBaseKwChange={(baseKw) => update({ baseKw })}
            onAdd={handleAdd}
            onUpdate={handleUpdate}
            onRemove={handleRemove}
          />
        </div>
      </main>

      <footer>
        <div className="space-y-1.5 px-4 py-5 text-[13px] leading-relaxed text-fg-subtle sm:px-6 lg:px-8">
          <p>
            Irradiance and weather data:{" "}
            <a href="https://open-meteo.com/" className="underline underline-offset-2 hover:text-fg">
              Open-Meteo.com
            </a>{" "}
            (CC BY 4.0), using tilted-plane irradiance for your panel angle and direction.
          </p>
          <p>
            Output = panel size × irradiance × system efficiency, reduced for hot panels (−0.37%/°C). Estimates only;
            real output depends on shading, panel condition and inverter limits.
          </p>
        </div>
      </footer>
    </div>
  );
};

type ResultsProps = {
  data: IrradianceData | null;
  status: "loading" | "ready" | "error";
  error: string | null;
  isRefreshing: boolean;
  onRetry: () => void;
  settings: Settings;
  selectedDay: number;
  onSelectDay: (index: number) => void;
};

const Results = ({ data, status, error, isRefreshing, onRetry, ...rest }: ResultsProps) => {
  if (status === "error" && !data) {
    return (
      <div role="alert" className="flex flex-col items-center rounded-xl bg-subtle px-4 py-10 text-center">
        <CloudOff aria-hidden className="size-6 text-fg-subtle" />
        <p className="mt-3 font-medium text-fg">Couldn&apos;t load solar data</p>
        <p className="mt-1 max-w-sm text-sm text-fg-muted">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className={`pressable mt-4 inline-flex h-9 items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-on-accent hover:bg-accent-hover ${focusRing}`}
        >
          <RotateCw aria-hidden className="size-4" />
          Try again
        </button>
      </div>
    );
  }

  if (!data) {
    return (
      <div aria-busy="true" aria-label="Loading solar data" className="space-y-4">
        <div className="flex gap-1.5">
          {Array.from({ length: 7 }, (_, i) => (
            <Skeleton key={i} className="h-14 w-[5.25rem] shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[5.25rem]" />
          ))}
        </div>
        <Skeleton className="h-64 sm:h-72" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  return (
    <div
      className={`fade-in transition-opacity duration-150 ${isRefreshing ? "opacity-60" : ""}`}
      aria-busy={isRefreshing}
    >
      {status === "error" && (
        <p role="alert" className="mb-3 flex items-center justify-between gap-3 rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {error}
          <button type="button" onClick={onRetry} className={`pressable shrink-0 font-medium underline ${focusRing}`}>
            Retry
          </button>
        </p>
      )}
      <DayView data={data} isRefreshing={isRefreshing} {...rest} />
    </div>
  );
};

type DayViewProps = Omit<ResultsProps, "data" | "status" | "error" | "onRetry"> & { data: IrradianceData };

/** Only rendered on the client once data exists, so reading the clock here is safe. */
const DayView = ({ data, settings, selectedDay, onSelectDay, isRefreshing }: DayViewProps) => {
  const now = lahoreNow();
  // A cached forecast can still start yesterday just after midnight; drop days already over.
  const days = useMemo(() => {
    const upcoming = data.mode === "forecast" ? data.days.filter((d) => d.date >= now.date) : data.days;
    return upcoming.length > 0 ? upcoming : data.days;
  }, [data, now.date]);
  const dayIndex = Math.min(selectedDay, days.length - 1);
  const day = days[dayIndex];
  const isToday = data.mode === "forecast" && day.date === now.date;
  const earliestSlot = isToday ? now.hour + (now.minute > 0 ? 1 : 0) : 0;

  const tabs = useMemo(
    () =>
      days.map((d, i) => ({
        label: d.date === now.date ? "Today" : i === 1 && days[0].date === now.date ? "Tomorrow" : dayLabels(d.date).short,
        kwh: pvSeries(settings.kwp, d.slots, settings.pr).reduce((a, b) => a + b, 0),
        cloud: daylightCloud(d.slots),
      })),
    [days, settings.kwp, settings.pr, now.date],
  );

  const plan = useMemo(() => {
    const pv = pvSeries(settings.kwp, day.slots, settings.pr);
    return planDay(pv, settings.baseKw, settings.appliances, Math.min(earliestSlot, 24));
  }, [day, settings.kwp, settings.pr, settings.baseKw, settings.appliances, earliestSlot]);

  const remainingSolar = plan.hours.slice(earliestSlot).some((h) => h.pvKw > h.baseKw);
  const heading =
    data.mode === "typical"
      ? `Average ${MONTHS[(data.month ?? 1) - 1]} day (${data.year} data)`
      : dayLabels(day.date).long;

  return (
    <div className="space-y-5">
      {data.mode === "forecast" && <DayTabs days={tabs} selected={dayIndex} onSelect={onSelectDay} />}

      <div
        id="day-panel"
        role={data.mode === "forecast" ? "tabpanel" : undefined}
        aria-labelledby={data.mode === "forecast" ? `day-tab-${dayIndex}` : undefined}
        className="space-y-5"
      >
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-fg">{heading}</h3>
          {isRefreshing && (
            <span className="flex items-center gap-1.5 text-[13px] text-fg-subtle">
              <Loader2 aria-hidden className="size-3.5 animate-spin motion-reduce:animate-none" />
              Updating
            </span>
          )}
        </div>

        <KpiRow plan={plan} />

        {/* Side by side on wide screens so the extra width carries content, not stretched rows. */}
        <div className="grid gap-5 2xl:grid-cols-2 2xl:gap-8">
          <div className="min-w-0">
            <h3 className="mb-2 text-sm font-semibold text-fg">Hour by hour</h3>
            <HourlyChart plan={plan} nowHour={isToday ? now.hour : null} />
          </div>

          <div className="min-w-0">
            <h3 className="mb-1 text-sm font-semibold text-fg">Best times to run heavy appliances</h3>
            <p className="mb-3 text-[13px] text-fg-muted">
              Biggest loads get the sunniest slot first.
              {isToday && earliestSlot > 0 ? " Only the hours left today are used." : ""}
            </p>
            <ScheduleList plan={plan} isToday={isToday} daylightOver={isToday && !remainingSolar} />
          </div>
        </div>
      </div>
    </div>
  );
};
