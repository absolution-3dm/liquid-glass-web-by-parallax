"use client";

import type { IconSvgElement } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ColorPicker,
  ColorPickerArea,
  ColorPickerContent,
  ColorPickerEyeDropper,
  ColorPickerFormatSelect,
  ColorPickerHueSlider,
  ColorPickerInput,
  ColorPickerSwatch,
  ColorPickerTrigger,
} from "@/components/ui/color-picker";

export type CustomizeColorFieldProps = {
  label: string;
  value: string;
  icon?: IconSvgElement;
  disabled?: boolean;
  onChange: (value: string) => void;
  className?: string;
};

export function CustomizeColorField({
  label,
  value,
  icon,
  disabled = false,
  onChange,
  className,
}: CustomizeColorFieldProps) {
  return (
    <div className={["customize-color-field", className].filter(Boolean).join(" ")}>
      <div className="customize-color-field__header">
        <span className="customize-color-field__label">
          {icon ? (
            <HugeiconsIcon
              icon={icon}
              size={14}
              color="currentColor"
              strokeWidth={1.75}
              aria-hidden
            />
          ) : null}
          <span>{label}</span>
        </span>
        <span className="customize-color-field__value">{value}</span>
      </div>

      <ColorPicker
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        defaultFormat="hex"
        modal
      >
        <ColorPickerTrigger asChild>
          <button
            type="button"
            className="customize-color-field__trigger"
            disabled={disabled}
            aria-label={`${label} color picker`}
          >
            <ColorPickerSwatch className="customize-color-field__swatch" />
            <span className="customize-color-field__prompt">Edit color</span>
          </button>
        </ColorPickerTrigger>

        <ColorPickerContent
          align="end"
          side="left"
          sideOffset={12}
          className="customize-color-field__popover"
        >
          <ColorPickerArea />
          <ColorPickerHueSlider />
          <div className="flex items-center gap-2">
            <ColorPickerEyeDropper />
            <ColorPickerFormatSelect />
            <ColorPickerInput withoutAlpha className="flex-1" />
          </div>
        </ColorPickerContent>
      </ColorPicker>
    </div>
  );
}
