import type { GlassEngineParams, GlassPointerHighlightParams } from "../registry/liquid-glass/refraction/engine";

export type SliderParamDef = {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  format?: (value: number) => string;
};

export const advancedMaterialParamDefs: SliderParamDef[] = [
  { key: "depth", label: "Depth", min: 0, max: 40, step: 1 },
  { key: "curvature", label: "Curvature", min: 0, max: 1, step: 0.01 },
  { key: "splay", label: "Splay", min: 0, max: 1, step: 0.01 },
  { key: "glow", label: "Glow", min: 0, max: 0.2, step: 0.005 },
  { key: "edgeHighlight", label: "Edge Highlight", min: 0, max: 2, step: 0.01 },
  { key: "specular", label: "Specular", min: 0, max: 5, step: 0.05 },
  { key: "specularAngle", label: "Specular Angle", min: 0, max: 360, step: 1, format: (v) => `${Math.round(v)}°` },
];

export const engineParamDefs: SliderParamDef[] = [
  { key: "glareOppositeFactor", label: "Glare Opposite", min: 0, max: 1, step: 0.01 },
  { key: "specularColorPreserve", label: "Specular Preserve", min: 0, max: 1, step: 0.01 },
  { key: "glowSpread", label: "Glow Spread", min: 0, max: 0.5, step: 0.01 },
  { key: "glowExponent", label: "Glow Exponent", min: 0.5, max: 5, step: 0.1 },
  { key: "edgeWidth", label: "Edge Width", min: 0, max: 10, step: 0.1 },
  { key: "edgeExponent", label: "Edge Exponent", min: 0.5, max: 5, step: 0.1 },
  { key: "chromaRedBoost", label: "Chroma Red", min: 0, max: 1, step: 0.01 },
  { key: "chromaGreenBoost", label: "Chroma Green", min: 0, max: 1, step: 0.01 },
  { key: "backdropSaturateSvg", label: "Saturate SVG", min: 1, max: 3, step: 0.05 },
  { key: "backdropSaturateCssBlur", label: "Saturate Blur", min: 1, max: 3, step: 0.05 },
];

export const pointerParamDefs: SliderParamDef[] = [
  { key: "hoverStrength", label: "Hover Strength", min: 0, max: 1, step: 0.01 },
  { key: "pressedStrength", label: "Pressed Strength", min: 0, max: 1, step: 0.01 },
  { key: "bloomOpacity", label: "Bloom Opacity", min: 0, max: 0.5, step: 0.01 },
  { key: "radius", label: "Radius", min: 24, max: 160, step: 1, format: (v) => `${Math.round(v)} px` },
  { key: "saturation", label: "Saturation", min: 1, max: 2, step: 0.01 },
  { key: "brightness", label: "Brightness", min: 1, max: 1.5, step: 0.01 },
];

export function diffPartial<T extends Record<string, unknown>>(value: T, base: T): Partial<T> {
  const diff: Partial<T> = {};
  for (const key of Object.keys(value) as Array<keyof T>) {
    if (value[key] !== base[key]) {
      diff[key] = value[key];
    }
  }
  return diff;
}

export function formatNumeric(value: number) {
  if (Number.isInteger(value)) return String(value);
  return Number(value.toFixed(4)).toString();
}

export function formatJsxObject(
  value: Record<string, string | number>,
  indent = "  ",
) {
  const lines = Object.entries(value).map(
    ([key, entry]) => `${indent}${key}: ${typeof entry === "string" ? `"${entry}"` : formatNumeric(entry)},`,
  );
  return `{\n${lines.join("\n")}\n}`;
}

export type EngineState = GlassEngineParams;
export type PointerState = GlassPointerHighlightParams;
