"use client";

import { useState, type ReactNode } from "react";
import { clamp } from "@/lib/settings";

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

type CardProps = {
  title?: string;
  titleId?: string;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

export const Card = ({ title, titleId, description, action, children, className = "" }: CardProps) => (
  <section
    aria-labelledby={titleId}
    className={`rounded-xl border border-line bg-surface p-4 shadow-card sm:p-5 ${className}`}
  >
    {(title || action) && (
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {title && (
            <h2 id={titleId} className="text-[15px] font-semibold tracking-tight text-fg">
              {title}
            </h2>
          )}
          {description && <p className="mt-0.5 text-sm text-fg-muted">{description}</p>}
        </div>
        {action}
      </header>
    )}
    {children}
  </section>
);

type NumberFieldProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  unit: string;
  hint?: ReactNode;
  hideLabel?: boolean;
};

/** Number input that lets people clear and retype freely; commits only valid values. */
export const NumberField = ({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step,
  unit,
  hint,
  hideLabel = false,
}: NumberFieldProps) => {
  const [draft, setDraft] = useState<string | null>(null);

  const handleChange = (raw: string) => {
    setDraft(raw);
    const parsed = Number(raw);
    if (raw.trim() !== "" && Number.isFinite(parsed)) onChange(clamp(parsed, min, max));
  };

  return (
    <div className="min-w-0">
      <label
        htmlFor={id}
        className={hideLabel ? "sr-only" : "mb-1.5 block text-sm font-medium text-fg"}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={draft ?? String(value)}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={() => setDraft(null)}
          aria-describedby={hint ? `${id}-hint` : undefined}
          className={`tnum h-10 w-full rounded-lg border border-control bg-surface pr-12 pl-3 text-[15px] text-fg transition-[border-color] duration-150 hover:border-fg-subtle ${focusRing}`}
        />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-fg-subtle">
          {unit}
        </span>
      </div>
      {hint && (
        <p id={`${id}-hint`} className="mt-1.5 text-[13px] leading-snug text-fg-subtle">
          {hint}
        </p>
      )}
    </div>
  );
};

type SegmentedOption<T extends string> = { value: T; label: string; title?: string };

type SegmentedControlProps<T extends string> = {
  name: string;
  legend: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  hint?: ReactNode;
  hideLegend?: boolean;
};

/** Native radio group styled as a segmented control: arrow keys work out of the box. */
export const SegmentedControl = <T extends string>({
  name,
  legend,
  value,
  options,
  onChange,
  hint,
  hideLegend = false,
}: SegmentedControlProps<T>) => (
  <fieldset className="min-w-0">
    <legend className={hideLegend ? "sr-only" : "mb-1.5 text-sm font-medium text-fg"}>{legend}</legend>
    <div
      className="grid gap-1 rounded-lg border border-line bg-subtle p-1"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {options.map((option) => (
        <label key={option.value} className="relative min-w-0" title={option.title}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="peer sr-only"
          />
          <span
            className={`pressable flex h-8 cursor-pointer items-center justify-center truncate rounded-md px-2 text-sm font-medium text-fg-muted hover:text-fg peer-checked:bg-surface peer-checked:text-accent-text peer-checked:shadow-card peer-checked:ring-1 peer-checked:ring-accent peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-accent`}
          >
            {option.label}
          </span>
        </label>
      ))}
    </div>
    {hint && <p className="mt-1.5 text-[13px] leading-snug text-fg-subtle">{hint}</p>}
  </fieldset>
);

type ChipProps = {
  children: ReactNode;
  onClick: () => void;
  pressed?: boolean;
  disabled?: boolean;
  label?: string;
};

export const Chip = ({ children, onClick, pressed, disabled, label }: ChipProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    aria-pressed={pressed}
    aria-label={label}
    className={`pressable inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 ${focusRing} ${
      pressed
        ? "border-accent bg-accent-soft text-accent-text"
        : "border-line bg-surface text-fg-muted hover:border-control hover:text-fg"
    }`}
  >
    {children}
  </button>
);

export const Skeleton = ({ className = "" }: { className?: string }) => (
  <div aria-hidden className={`animate-pulse rounded-lg bg-subtle motion-reduce:animate-none ${className}`} />
);
