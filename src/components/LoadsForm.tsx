"use client";

import { Plus, X } from "lucide-react";
import { duration } from "@/lib/format";
import { APPLIANCE_PRESETS, LIMITS, displayName, type AppliancePreset } from "@/lib/presets";
import type { Appliance } from "@/lib/types";
import { Card, Chip, NumberField, focusRing } from "./ui";

type LoadsFormProps = {
  baseKw: number;
  appliances: Appliance[];
  onBaseKwChange: (baseKw: number) => void;
  onAdd: (preset: Omit<AppliancePreset, "key">) => void;
  onUpdate: (id: string, patch: Partial<Appliance>) => void;
  onRemove: (id: string) => void;
};

const CUSTOM: Omit<AppliancePreset, "key"> = { name: "Custom appliance", kw: 1, hours: 1 };

export const LoadsForm = ({ baseKw, appliances, onBaseKwChange, onAdd, onUpdate, onRemove }: LoadsFormProps) => {
  const full = appliances.length >= LIMITS.maxAppliances;

  return (
    <Card title="Your loads" titleId="loads-heading" description="What runs all day, and the heavy appliances you can move.">
      <div className="space-y-5">
        <NumberField
          id="base-kw"
          label="Always-on load"
          value={baseKw}
          onChange={onBaseKwChange}
          min={LIMITS.baseKw.min}
          max={LIMITS.baseKw.max}
          step={0.1}
          unit="kW"
          hint="Fridge, fans, lights, router and so on. Most homes run 0.4–0.8 kW."
        />

        <div>
          <h3 className="mb-2 text-sm font-medium text-fg">Heavy appliances</h3>
          {appliances.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line px-3 py-4 text-center text-sm text-fg-muted">
              No appliances yet. Add one below to get a recommended time.
            </p>
          ) : (
            <ul className="space-y-2">
              {appliances.map((appliance) => (
                <li key={appliance.id} className="rounded-lg border border-line bg-canvas p-3">
                  <div className="flex items-center gap-2">
                    <label htmlFor={`name-${appliance.id}`} className="sr-only">
                      Appliance name
                    </label>
                    <input
                      id={`name-${appliance.id}`}
                      value={appliance.name}
                      placeholder="Appliance name"
                      maxLength={40}
                      onChange={(e) => onUpdate(appliance.id, { name: e.target.value })}
                      className={`h-9 min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-2 text-[15px] font-medium text-fg hover:border-line focus-visible:border-control ${focusRing}`}
                    />
                    <button
                      type="button"
                      onClick={() => onRemove(appliance.id)}
                      aria-label={`Remove ${displayName(appliance)}`}
                      className={`pressable grid size-9 shrink-0 place-items-center rounded-md text-fg-subtle hover:bg-danger-soft hover:text-danger ${focusRing}`}
                    >
                      <X aria-hidden className="size-4" />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <NumberField
                      id={`kw-${appliance.id}`}
                      label={`${displayName(appliance)} power`}
                      hideLabel
                      value={appliance.kw}
                      onChange={(kw) => onUpdate(appliance.id, { kw })}
                      min={LIMITS.applianceKw.min}
                      max={LIMITS.applianceKw.max}
                      step={0.05}
                      unit="kW"
                    />
                    <NumberField
                      id={`hours-${appliance.id}`}
                      label={`${displayName(appliance)} run time`}
                      hideLabel
                      value={appliance.hours}
                      onChange={(hours) => onUpdate(appliance.id, { hours })}
                      min={LIMITS.applianceHours.min}
                      max={LIMITS.applianceHours.max}
                      step={0.25}
                      unit="hours"
                    />
                  </div>
                  <p className="mt-1.5 px-0.5 text-[13px] text-fg-subtle">
                    <span className="tnum">{(appliance.kw * appliance.hours).toFixed(2)} kWh</span> per day ·{" "}
                    {duration(appliance.hours)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 id="quick-add" className="mb-2 text-sm font-medium text-fg">
            Add an appliance
          </h3>
          <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="quick-add">
            {APPLIANCE_PRESETS.map(({ key, ...preset }) => (
              <Chip key={key} onClick={() => onAdd(preset)} disabled={full}>
                <Plus aria-hidden className="size-3.5" />
                {preset.name}
              </Chip>
            ))}
            <Chip onClick={() => onAdd(CUSTOM)} disabled={full}>
              <Plus aria-hidden className="size-3.5" />
              Custom
            </Chip>
          </div>
          {full && (
            <p className="mt-2 text-[13px] text-fg-subtle">You can plan up to {LIMITS.maxAppliances} appliances.</p>
          )}
        </div>
      </div>
    </Card>
  );
};
