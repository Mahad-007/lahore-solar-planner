"use client";

import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { clock, kw } from "@/lib/format";
import type { DayPlan } from "@/lib/scheduler";

type Row = {
  hour: number;
  solar: number;
  base: number;
  appliances: number;
  running: { id: string; name: string; kw: number }[];
};

const SERIES = [
  { key: "solar", label: "Solar output", swatch: "bg-chart-solar" },
  { key: "base", label: "Always-on load", swatch: "bg-chart-base" },
  { key: "appliances", label: "Scheduled appliances", swatch: "bg-chart-appliance" },
] as const;

type TooltipProps = { active?: boolean; payload?: ReadonlyArray<{ payload?: Row }> };

const ChartTooltip = ({ active, payload }: TooltipProps) => {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  const load = row.base + row.appliances;
  const net = row.solar - load;
  return (
    <div className="min-w-48 rounded-lg border border-line bg-surface px-3 py-2.5 text-[13px]">
      <p className="tnum mb-1.5 font-semibold text-fg">
        {clock(row.hour)}–{clock(row.hour + 1)}
      </p>
      <dl className="space-y-1">
        <div className="flex justify-between gap-4">
          <dt className="flex items-center gap-1.5 text-fg-muted">
            <span aria-hidden className="size-2 rounded-full bg-chart-solar" />
            Solar
          </dt>
          <dd className="tnum font-medium text-fg">{kw(row.solar)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="flex items-center gap-1.5 text-fg-muted">
            <span aria-hidden className="size-2 rounded-full bg-chart-base" />
            Always-on
          </dt>
          <dd className="tnum font-medium text-fg">{kw(row.base)}</dd>
        </div>
        {row.running.map((r) => (
          <div key={r.id} className="flex justify-between gap-4">
            <dt className="flex min-w-0 items-center gap-1.5 text-fg-muted">
              <span aria-hidden className="size-2 shrink-0 rounded-full bg-chart-appliance" />
              <span className="truncate">{r.name}</span>
            </dt>
            <dd className="tnum font-medium text-fg">{kw(r.kw)}</dd>
          </div>
        ))}
      </dl>
      <p className={`tnum mt-2 border-t border-line pt-1.5 font-medium ${net >= 0 ? "text-fg" : "text-danger"}`}>
        {net >= 0 ? `${kw(net)} spare solar` : `${kw(-net)} from grid`}
      </p>
    </div>
  );
};

/** Round axis maximum and evenly spaced ticks: 0, 0.5, 1… or 0, 2, 4… */
const niceTicks = (max: number): number[] => {
  const step = [0.25, 0.5, 1, 2, 5, 10].find((s) => max / s <= 5) ?? 20;
  const top = Math.max(Math.ceil(max / step) * step, step);
  return Array.from({ length: Math.round(top / step) + 1 }, (_, i) => +(i * step).toFixed(2));
};

const shortHour = (h: number) => String(h).padStart(2, "0");

type HourlyChartProps = { plan: DayPlan; nowHour: number | null };

export const HourlyChart = ({ plan, nowHour }: HourlyChartProps) => {
  const rows: Row[] = plan.hours.map((h) => ({
    hour: h.hour,
    solar: h.pvKw,
    base: h.baseKw,
    appliances: h.applianceKw,
    running: h.running,
  }));
  const peak = Math.max(...rows.map((r) => r.solar));
  const yTicks = niceTicks(Math.max(peak, ...rows.map((r) => r.base + r.appliances)));
  const summary =
    plan.peakHour === null
      ? "No meaningful solar output on this day."
      : `Solar output peaks at ${kw(peak)} between ${clock(plan.peakHour)} and ${clock(plan.peakHour + 1)}.`;

  return (
    <figure>
      <figcaption className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-fg-muted">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span aria-hidden className={`size-2.5 rounded-sm ${s.swatch}`} />
            {s.label}
          </span>
        ))}
        <span className="ml-auto text-fg-subtle">kW by hour of day</span>
        <span className="sr-only">{summary}</span>
      </figcaption>

      <div className="h-64 sm:h-72 2xl:h-80" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 4, bottom: 0, left: -8 }} barCategoryGap="22%">
            <CartesianGrid vertical={false} stroke="var(--line)" />
            <XAxis
              dataKey="hour"
              ticks={[0, 3, 6, 9, 12, 15, 18, 21]}
              tickFormatter={shortHour}
              tick={{ fill: "var(--fg-subtle)", fontSize: 12 }}
              axisLine={{ stroke: "var(--line)" }}
              tickLine={false}
              interval={0}
            />
            <YAxis
              tick={{ fill: "var(--fg-subtle)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={36}
              ticks={yTicks}
              domain={[0, yTicks[yTicks.length - 1]]}
              interval={0}
            />
            <Tooltip
              content={(props) => <ChartTooltip active={props.active} payload={props.payload as TooltipProps["payload"]} />}
              cursor={{ fill: "var(--subtle)" }}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="solar"
              fill="var(--chart-solar-fill)"
              fillOpacity={1}
              stroke="var(--chart-solar)"
              strokeWidth={2.5}
              isAnimationActive={false}
              activeDot={{ r: 4, fill: "var(--chart-solar)", stroke: "var(--surface)", strokeWidth: 2 }}
            />
            <Bar dataKey="base" stackId="load" fill="var(--chart-base)" maxBarSize={18} isAnimationActive={false} />
            <Bar
              dataKey="appliances"
              stackId="load"
              fill="var(--chart-appliance)"
              stroke="var(--surface)"
              strokeWidth={1}
              radius={[4, 4, 0, 0]}
              maxBarSize={18}
              isAnimationActive={false}
            />
            {nowHour !== null && (
              <ReferenceLine
                x={nowHour}
                stroke="var(--fg-subtle)"
                strokeDasharray="3 3"
                label={{ value: "Now", position: "insideTopRight", fill: "var(--fg-muted)", fontSize: 11 }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <details className="mt-3 text-sm">
        <summary className="cursor-pointer text-fg-muted hover:text-fg">Show hourly table</summary>
        <div className="mt-2 max-h-72 overflow-auto rounded-xl bg-subtle">
          <table className="tnum w-full text-left text-[13px]">
            <thead className="sticky top-0 bg-subtle-2 text-fg-muted">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Hour</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Solar</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Load</th>
                <th scope="col" className="px-3 py-2 text-right font-medium">Net</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const net = r.solar - r.base - r.appliances;
                return (
                  <tr key={r.hour} className="border-t border-line">
                    <th scope="row" className="px-3 py-1.5 font-normal text-fg-muted">
                      {clock(r.hour)}–{clock(r.hour + 1)}
                    </th>
                    <td className="px-3 py-1.5 text-right text-fg">{kw(r.solar)}</td>
                    <td className="px-3 py-1.5 text-right text-fg">{kw(r.base + r.appliances)}</td>
                    <td className={`px-3 py-1.5 text-right ${net < 0 ? "text-danger" : "text-fg"}`}>
                      {net >= 0 ? "+" : "−"}
                      {kw(Math.abs(net))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
};
