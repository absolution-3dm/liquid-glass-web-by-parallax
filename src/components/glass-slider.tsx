"use client";

import { Slider } from "./ui/slider";

export type GlassSliderProps = {
  label: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  /** Optional formatted value shown on the right inside the track. */
  display?: string;
  disabled?: boolean;
  onChange: (value: number) => void;
  className?: string;
};

export function GlassSlider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  display,
  disabled = false,
  onChange,
  className,
}: GlassSliderProps) {
  const formattedValue = display ?? formatSliderValue(value, step);

  return (
    <div className={["glass-slider", className].filter(Boolean).join(" ")}>
      <div className="glass-slider__header">
        <span className="glass-slider__label">{label}</span>
        <span className="glass-slider__value">{formattedValue}</span>
      </div>

      <Slider
        className="glass-slider__control"
        value={[value]}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        onValueChange={(next) => onChange(next[0] ?? min)}
        aria-label={label}
      />
    </div>
  );
}

function formatSliderValue(value: number, step: number) {
  if (Number.isInteger(step)) {
    return String(Math.round(value));
  }

  const decimals = step.toString().includes(".")
    ? step.toString().split(".")[1]?.length ?? 2
    : 2;
  return value.toFixed(decimals);
}
