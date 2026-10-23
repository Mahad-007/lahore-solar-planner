"use client";

import { Cloud, CloudSun, Sun } from "lucide-react";
import { useRef, type KeyboardEvent } from "react";
import { focusRing } from "./ui";

export type DayTab = { label: string; kwh: number; cloud: number };

type DayTabsProps = {
  days: DayTab[];
  selected: number;
  onSelect: (index: number) => void;
};

const WeatherIcon = ({ cloud }: { cloud: number }) => {
  if (cloud < 25) return <Sun aria-hidden className="size-4 text-solar-text" />;
  if (cloud < 65) return <CloudSun aria-hidden className="size-4 text-fg-subtle" />;
  return <Cloud aria-hidden className="size-4 text-fg-subtle" />;
};

const weatherWord = (cloud: number) => (cloud < 25 ? "sunny" : cloud < 65 ? "partly cloudy" : "cloudy");

/** Tabs switch instantly: people flip between days to compare, so no transition. */
export const DayTabs = ({ days, selected, onSelect }: DayTabsProps) => {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (event: KeyboardEvent, index: number) => {
    const last = days.length - 1;
    const next =
      event.key === "ArrowRight" ? (index === last ? 0 : index + 1)
      : event.key === "ArrowLeft" ? (index === 0 ? last : index - 1)
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (next === null) return;
    event.preventDefault();
    onSelect(next);
    refs.current[next]?.focus();
  };

  return (
    <div>
      <p className="mb-1 text-[13px] text-fg-subtle">Estimated daily solar, kWh</p>
      <div
        role="tablist"
        aria-label="Forecast day"
        className="-mx-1 flex snap-x gap-1.5 overflow-x-auto px-1 pt-1 pb-1.5 [scrollbar-width:thin] xl:grid xl:grid-cols-7 xl:overflow-visible"
      >
        {days.map((day, index) => {
          const active = index === selected;
          return (
            <button
              key={day.label}
              ref={(el) => {
                refs.current[index] = el;
              }}
              type="button"
              role="tab"
              id={`day-tab-${index}`}
              aria-selected={active}
              aria-controls="day-panel"
              aria-label={`${day.label}, ${day.kwh.toFixed(1)} kilowatt hours, ${weatherWord(day.cloud)}`}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={`pressable flex min-w-[4.75rem] shrink-0 snap-start xl:min-w-0 flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left ${focusRing} ${
                active
                  ? "border-accent bg-accent-soft"
                  : "border-line bg-surface hover:border-control"
              }`}
            >
              <span className={`text-xs font-medium ${active ? "text-accent-text" : "text-fg-muted"}`}>{day.label}</span>
              <span className="flex items-center gap-1.5">
                <WeatherIcon cloud={day.cloud} />
                <span className="tnum text-sm font-semibold text-fg">{day.kwh.toFixed(1)}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
