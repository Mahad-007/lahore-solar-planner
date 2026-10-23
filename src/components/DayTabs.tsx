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

const WeatherIcon = ({ cloud, active }: { cloud: number; active: boolean }) => {
  const tone = active ? "text-on-accent" : cloud < 25 ? "text-solar-text" : "text-fg-subtle";
  const Icon = cloud < 25 ? Sun : cloud < 65 ? CloudSun : Cloud;
  return <Icon aria-hidden className={`size-4 ${tone}`} />;
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
              className={`pressable flex min-w-[4.75rem] shrink-0 snap-start flex-col items-start gap-1 rounded-lg px-3 py-2 text-left xl:min-w-0 ${focusRing} ${
                active ? "bg-accent" : "bg-subtle hover:bg-subtle-2"
              }`}
            >
              <span className={`text-xs font-medium ${active ? "text-on-accent" : "text-fg-muted"}`}>{day.label}</span>
              <span className="flex items-center gap-1.5">
                <WeatherIcon cloud={day.cloud} active={active} />
                <span className={`tnum text-sm font-semibold ${active ? "text-on-accent" : "text-fg"}`}>
                  {day.kwh.toFixed(1)}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
