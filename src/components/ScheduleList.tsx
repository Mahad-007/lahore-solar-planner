import { AlertTriangle, CircleSlash, Sun, Zap } from "lucide-react";
import { clock, duration, kw, kwh, percent } from "@/lib/format";
import { displayName } from "@/lib/presets";
import type { DayPlan, Placement } from "@/lib/scheduler";

const CoverageBadge = ({ coverage }: { coverage: number }) => {
  if (coverage >= 0.995)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-solar-soft px-2 py-0.5 text-xs font-semibold text-solar-text">
        <Sun aria-hidden className="size-3.5" />
        100% solar
      </span>
    );
  if (coverage >= 0.5)
    return (
      <span className="tnum inline-flex items-center gap-1 rounded-full bg-subtle px-2 py-0.5 text-xs font-semibold text-fg-muted">
        <Sun aria-hidden className="size-3.5" />
        {percent(coverage)} solar
      </span>
    );
  return (
    <span className="tnum inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
      <Zap aria-hidden className="size-3.5" />
      {coverage > 0 ? `${percent(coverage)} solar` : "Grid only"}
    </span>
  );
};

const limitMessage = (p: Placement, peakSurplus: number): string | null => {
  if (p.status === "no-time") return "Doesn't fit in the hours left today.";
  if (p.status === "no-solar") return `No spare solar left, so it would use ${kwh(p.gridKwh)} from the grid.`;
  switch (p.limitedBy) {
    case "power":
      return `Draws ${kw(p.appliance.kw)}, more than your ${kw(peakSurplus)} peak surplus. Run it with nothing else heavy on, or add panels.`;
    case "duration":
      return `Runs longer than the sunny hours, so ${kwh(p.gridKwh)} comes from the grid.`;
    case "shared":
      return `Shares the sunny hours with other appliances. Moving one to another day would cover it fully.`;
    default:
      return null;
  }
};

type ScheduleListProps = { plan: DayPlan; isToday: boolean; daylightOver: boolean };

export const ScheduleList = ({ plan, isToday, daylightOver }: ScheduleListProps) => {
  const peakSurplus = Math.max(...plan.hours.map((h) => Math.max(h.pvKw - h.baseKw, 0)));
  const scheduled = plan.placements.filter((p) => p.status === "scheduled").length;

  if (plan.placements.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-line px-4 py-8 text-center text-sm text-fg-muted">
        Add a heavy appliance in <span className="font-medium text-fg">Your loads</span> to see the best time to run it.
      </p>
    );
  }

  return (
    <div>
      {isToday && daylightOver && (
        <p className="mb-3 flex items-start gap-2 rounded-lg bg-subtle px-3 py-2.5 text-sm text-fg-muted">
          <CircleSlash aria-hidden className="mt-0.5 size-4 shrink-0" />
          Today&apos;s sunshine is over. Pick tomorrow above to plan ahead.
        </p>
      )}

      <p role="status" aria-live="polite" className="sr-only">
        {scheduled} of {plan.placements.length} appliances scheduled on solar. {percent(plan.solarShare)} of the
        day&apos;s load met by solar.
      </p>

      <ol className="space-y-2">
        {plan.placements.map((p) => {
          const message = limitMessage(p, peakSurplus);
          return (
            <li key={p.appliance.id} className="flex gap-3 rounded-lg border border-line p-3 sm:gap-4 sm:p-3.5">
              <div className="w-[4.5rem] shrink-0 sm:w-20">
                {p.start !== null ? (
                  <>
                    <p className="tnum font-mono text-[15px] font-semibold text-fg">{clock(p.start)}</p>
                    <p className="tnum text-[13px] text-fg-subtle">to {clock(p.start + p.appliance.hours)}</p>
                  </>
                ) : (
                  <p className="font-mono text-[15px] font-semibold text-fg-subtle" aria-label="Not scheduled">
                    —
                  </p>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <p className="truncate font-medium text-fg">{displayName(p.appliance)}</p>
                  <CoverageBadge coverage={p.coverage} />
                </div>
                <p className="tnum mt-0.5 text-[13px] text-fg-muted">
                  {duration(p.appliance.hours)} · {kw(p.appliance.kw)} · {kwh(p.energyKwh)}
                </p>
                {message && (
                  <p className="mt-1.5 flex items-start gap-1.5 text-[13px] leading-snug text-fg-muted">
                    <AlertTriangle aria-hidden className="mt-0.5 size-3.5 shrink-0 text-danger" />
                    {message}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {plan.surplusWindow && (
        <p className="tnum mt-4 text-[13px] leading-relaxed text-fg-muted">
          Before {clock(plan.surplusWindow.start)} and after {clock(plan.surplusWindow.end)} your panels can&apos;t
          cover even the always-on load, so keep heavy appliances out of those hours.
          {plan.unusedSolarKwh > 0.05 &&
            ` About ${kwh(plan.unusedSolarKwh)} of solar goes unused; with net metering it is exported to the grid.`}
        </p>
      )}
    </div>
  );
};
