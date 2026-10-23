"use client";

import { ChevronDown } from "lucide-react";
import { LIMITS, PANEL_SIZES } from "@/lib/presets";
import { ORIENTATIONS } from "@/lib/solar";
import type { OrientationId, Settings } from "@/lib/types";
import { Card, Chip, NumberField, SegmentedControl, focusRing } from "./ui";

type SystemFormProps = {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
};

export const SystemForm = ({ settings, onChange }: SystemFormProps) => (
  <Card title="Your solar system" titleId="system-heading" description="Size and placement of your panels.">
    <div className="space-y-5">
      <div>
        <NumberField
          id="kwp"
          label="Panel size"
          value={settings.kwp}
          onChange={(kwp) => onChange({ kwp })}
          min={LIMITS.kwp.min}
          max={LIMITS.kwp.max}
          step={0.5}
          unit="kWp"
          hint="On your installer's quote, e.g. 10 × 550 W panels = 5.5 kWp."
        />
        <div className="mt-2.5 flex flex-wrap gap-1.5" role="group" aria-label="Common panel sizes">
          {PANEL_SIZES.map((size) => (
            <Chip
              key={size}
              pressed={settings.kwp === size}
              onClick={() => onChange({ kwp: size })}
              label={`${size} kWp`}
            >
              <span className="tnum">{size}</span>
            </Chip>
          ))}
        </div>
      </div>

      <SegmentedControl<OrientationId>
        name="orientation"
        legend="Panels face"
        value={settings.orientation}
        onChange={(orientation) => onChange({ orientation })}
        options={ORIENTATIONS.map((o) => ({ value: o.id, label: o.id, title: o.label }))}
        hint="South gives the most energy in Lahore. East shifts output to the morning, west to the afternoon."
      />

      <div>
        <div className="mb-1.5 flex items-baseline justify-between">
          <label htmlFor="tilt" className="text-sm font-medium text-fg">
            Tilt angle
          </label>
          <output htmlFor="tilt" className="tnum text-sm font-medium text-fg">
            {settings.tilt}°
          </output>
        </div>
        <input
          id="tilt"
          type="range"
          min={LIMITS.tilt.min}
          max={LIMITS.tilt.max}
          step={1}
          value={settings.tilt}
          onChange={(e) => onChange({ tilt: Number(e.target.value) })}
          aria-describedby="tilt-hint"
          className={`h-6 w-full cursor-pointer rounded ${focusRing}`}
        />
        <p id="tilt-hint" className="mt-1 text-[13px] leading-snug text-fg-subtle">
          Most Lahore rooftop frames sit at 15–30°. Flat = 0°.
        </p>
      </div>

      <details className="group rounded-lg border border-line">
        <summary
          className={`flex cursor-pointer list-none items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-fg-muted hover:text-fg [&::-webkit-details-marker]:hidden ${focusRing}`}
        >
          Advanced
          <ChevronDown
            aria-hidden
            className="size-4 transition-transform duration-200 ease-out-strong group-open:rotate-180 motion-reduce:transition-none"
          />
        </summary>
        <div className="border-t border-line px-3 pt-3 pb-3.5">
          <div className="mb-1.5 flex items-baseline justify-between">
            <label htmlFor="pr" className="text-sm font-medium text-fg">
              System efficiency
            </label>
            <output htmlFor="pr" className="tnum text-sm font-medium text-fg">
              {Math.round(settings.pr * 100)}%
            </output>
          </div>
          <input
            id="pr"
            type="range"
            min={LIMITS.pr.min}
            max={LIMITS.pr.max}
            step={0.01}
            value={settings.pr}
            onChange={(e) => onChange({ pr: Number(e.target.value) })}
            aria-describedby="pr-hint"
            className={`h-6 w-full cursor-pointer rounded ${focusRing}`}
          />
          <p id="pr-hint" className="mt-1 text-[13px] leading-snug text-fg-subtle">
            Inverter, wiring and dust losses combined. 80% suits panels cleaned every couple of weeks; drop it
            to 70% if they are rarely washed.
          </p>
        </div>
      </details>
    </div>
  </Card>
);
