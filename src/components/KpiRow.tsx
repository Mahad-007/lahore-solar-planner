import { clock, kwh, percent } from "@/lib/format";
import type { DayPlan } from "@/lib/scheduler";

type Kpi = { label: string; value: string; detail: string };

const kpisFor = (plan: DayPlan): Kpi[] => [
  {
    label: "Solar generation",
    value: kwh(plan.generationKwh),
    detail:
      plan.peakHour === null
        ? "No useful sunlight"
        : `Peaks ${clock(plan.peakHour)}–${clock(plan.peakHour + 1)}`,
  },
  {
    label: "Surplus hours",
    value: plan.surplusWindow
      ? `${clock(plan.surplusWindow.start)}–${clock(plan.surplusWindow.end)}`
      : "None",
    detail: plan.surplusWindow ? "Solar beats your base load" : "Solar never beats base load",
  },
  {
    label: "Met by solar",
    value: percent(plan.solarShare),
    detail: `${plan.solarUsedKwh.toFixed(1)} of ${kwh(plan.loadKwh)} used`,
  },
  {
    label: "From grid",
    value: kwh(plan.gridKwh),
    detail: plan.unusedSolarKwh > 0.05 ? `${kwh(plan.unusedSolarKwh)} spare solar` : "No spare solar",
  },
];

export const KpiRow = ({ plan }: { plan: DayPlan }) => (
  <dl className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
    {kpisFor(plan).map((kpi) => (
      <div key={kpi.label} className="min-w-0 rounded-lg border border-line bg-canvas px-3 py-2.5 sm:px-3.5 sm:py-3">
        <dt className="truncate text-[13px] text-fg-muted">{kpi.label}</dt>
        <dd className="tnum mt-0.5 text-lg font-semibold tracking-tight text-fg sm:text-xl">{kpi.value}</dd>
        <dd className="tnum mt-0.5 text-[13px] leading-snug text-fg-subtle">{kpi.detail}</dd>
      </div>
    ))}
  </dl>
);
