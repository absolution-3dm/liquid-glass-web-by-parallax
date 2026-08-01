import registry from "./materials.json";

export const glassMaterialKeys = [
  "scale",
  "depth",
  "curvature",
  "splay",
  "chroma",
  "blur",
  "glow",
  "edgeHighlight",
  "specularAngle",
  "specular",
  "tint",
  "fill",
] as const;

export type GlassMaterialKey = (typeof glassMaterialKeys)[number];

export type GlassMaterialParams = {
  scale: number;
  depth: number;
  curvature: number;
  splay: number;
  chroma: number;
  blur: number;
  glow: number;
  edgeHighlight: number;
  specularAngle: number;
  specular: number;
  tint: number;
  fill: string;
};

export type GlassMaterialMode = "dark" | "light";
export type GlassPhysicalMaterialName = keyof typeof registry.physical;
export type GlassSemanticMaterialName = keyof typeof registry.recipes;
export type GlassMaterialName = GlassPhysicalMaterialName | GlassSemanticMaterialName;
export type GlassMaterialKind = "physical" | "semantic";
export type GlassMaterialInput =
  | GlassMaterialName
  | ({ preset?: GlassMaterialName } & Partial<GlassMaterialParams>);

export type GlassMaterialDescriptor = {
  name: GlassMaterialName;
  kind: GlassMaterialKind;
  label: string;
  description: string;
  base?: GlassPhysicalMaterialName;
};

const labels: Record<GlassMaterialName, Pick<GlassMaterialDescriptor, "label" | "description">> = {
  ultraThin: {
    label: "Ultra Thin",
    description: "最薄：轻折射、低模糊与低遮蔽，适合装饰与大面积背景。",
  },
  thin: {
    label: "Thin",
    description: "轻量控件：清晰背景，折射与边缘开始可读。",
  },
  regular: {
    label: "Regular",
    description: "中等厚度：折射、模糊和遮蔽的平衡点。",
  },
  thick: {
    label: "Thick",
    description: "更厚：更强折射与背景分离，适合浮层。",
  },
  ultraThick: {
    label: "Ultra Thick",
    description: "最厚：最强模糊与遮蔽，复杂背景上保持可读。",
  },
  navigation: {
    label: "Navigation",
    description: "站点现有 header、导航和 viewer chrome 的语义配方。",
  },
  control: {
    label: "Control",
    description: "按钮、icon pill 和紧凑交互控件的语义配方。",
  },
  panel: {
    label: "Panel",
    description: "菜单、popover 和浮动面板的语义配方。",
  },
  selectionPressed: {
    label: "Selection Pressed",
    description: "分段控件按压、拖拽时的高反馈材质。",
  },
};

const ranges: Record<
  Exclude<GlassMaterialKey, "fill" | "specularAngle">,
  readonly [number, number]
> = {
  scale: [0, Number.POSITIVE_INFINITY],
  depth: [0, Number.POSITIVE_INFINITY],
  curvature: [0, 1],
  splay: [0, 1],
  chroma: [0, 1],
  blur: [0, Number.POSITIVE_INFINITY],
  glow: [0, Number.POSITIVE_INFINITY],
  edgeHighlight: [0, Number.POSITIVE_INFINITY],
  specular: [0, Number.POSITIVE_INFINITY],
  tint: [0, 1],
};

const physicalNameSet = new Set<string>(Object.keys(registry.physical));
const semanticNameSet = new Set<string>(Object.keys(registry.recipes));
const materialKeySet = new Set<string>(glassMaterialKeys);

export const glassPhysicalMaterialNames = Object.freeze(
  Object.keys(registry.physical) as GlassPhysicalMaterialName[],
);
export const glassSemanticMaterialNames = Object.freeze(
  Object.keys(registry.recipes) as GlassSemanticMaterialName[],
);
export const glassMaterialNames = Object.freeze([
  ...glassPhysicalMaterialNames,
  ...glassSemanticMaterialNames,
]) as readonly GlassMaterialName[];

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function finiteNumber(value: unknown, key: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TypeError(`Glass material "${key}" must be a finite number.`);
  }
  return value;
}

function normalizeAngle(value: unknown) {
  const angle = finiteNumber(value, "specularAngle");
  return ((angle % 360) + 360) % 360;
}

function normalizeHexColor(value: unknown) {
  if (typeof value !== "string" || !/^#[0-9a-fA-F]{6}$/.test(value)) {
    throw new TypeError('Glass material "fill" must use #RRGGBB.');
  }
  return value.toLowerCase();
}

function normalizeMaterialValue(key: GlassMaterialKey, value: unknown): number | string {
  if (key === "fill") return normalizeHexColor(value);
  if (key === "specularAngle") return normalizeAngle(value);
  const [min, max] = ranges[key];
  return clamp(finiteNumber(value, key), min, max);
}

export function normalizeGlassMaterialParams(value: unknown): GlassMaterialParams {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Glass material parameters must be an object.");
  }

  const source = value as Record<string, unknown>;
  const normalized = {} as GlassMaterialParams;
  for (const key of glassMaterialKeys) {
    if (!(key in source)) {
      throw new TypeError(`Glass material is missing "${key}".`);
    }
    (normalized as Record<GlassMaterialKey, number | string>)[key] =
      normalizeMaterialValue(key, source[key]);
  }
  return normalized;
}

export function normalizeGlassMaterialOverrides(
  value: unknown,
): Partial<GlassMaterialParams> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new TypeError("Glass material overrides must be an object.");
  }

  const source = value as Record<string, unknown>;
  const normalized: Partial<GlassMaterialParams> = {};
  for (const key of Object.keys(source)) {
    if (!materialKeySet.has(key)) {
      throw new TypeError(`Unknown glass material parameter "${key}".`);
    }
    const materialKey = key as GlassMaterialKey;
    (normalized as Record<string, number | string>)[materialKey] =
      normalizeMaterialValue(materialKey, source[materialKey]);
  }
  return normalized;
}

export function isGlassMaterialName(value: unknown): value is GlassMaterialName {
  return (
    typeof value === "string" &&
    (physicalNameSet.has(value) || semanticNameSet.has(value))
  );
}

export function getGlassMaterialDescriptor(
  name: GlassMaterialName,
): GlassMaterialDescriptor {
  if (!isGlassMaterialName(name)) {
    throw new TypeError(`Unknown glass material preset "${String(name)}".`);
  }
  if (physicalNameSet.has(name)) {
    return Object.freeze({
      name,
      kind: "physical",
      ...labels[name],
    });
  }
  const recipe = registry.recipes[name as GlassSemanticMaterialName];
  return Object.freeze({
    name,
    kind: "semantic",
    base: recipe.base as GlassPhysicalMaterialName,
    ...labels[name],
  });
}

export function getGlassMaterialSource(name: GlassMaterialName): GlassMaterialParams {
  if (!isGlassMaterialName(name)) {
    throw new TypeError(`Unknown glass material preset "${String(name)}".`);
  }

  if (physicalNameSet.has(name)) {
    return Object.freeze(
      normalizeGlassMaterialParams(
        registry.physical[name as GlassPhysicalMaterialName],
      ),
    );
  }

  const recipe = registry.recipes[name as GlassSemanticMaterialName];
  if (!physicalNameSet.has(recipe.base)) {
    throw new TypeError(
      `Glass material recipe "${name}" has unknown base "${recipe.base}".`,
    );
  }
  const base = normalizeGlassMaterialParams(
    registry.physical[recipe.base as GlassPhysicalMaterialName],
  );
  const overrides = normalizeGlassMaterialOverrides(recipe.overrides);
  return Object.freeze(normalizeGlassMaterialParams({ ...base, ...overrides }));
}

function mixHexWithWhite(hex: string, amount: number) {
  const value = Number.parseInt(hex.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  const mixed = channels.map((channel) =>
    Math.round(channel + (255 - channel) * clamp(amount, 0, 1)),
  );
  return `#${mixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

/** Invert `mixHexWithWhite` so a light-mode fill can be stored as a dark source. */
function unmixHexFromWhite(hex: string, amount: number) {
  const t = clamp(amount, 0, 1);
  const normalized = normalizeHexColor(hex);
  if (t <= 0) return normalized;
  if (t >= 1) return "#ffffff";
  const value = Number.parseInt(normalized.slice(1), 16);
  const channels = [(value >> 16) & 255, (value >> 8) & 255, value & 255];
  const unmixed = channels.map((channel) => {
    const raw = (channel - 255 * t) / (1 - t);
    return Math.round(clamp(raw, 0, 255));
  });
  return `#${unmixed.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

/** Fill color as shown/edited for the active material mode. */
export function glassFillForMode(
  sourceFill: string,
  mode: GlassMaterialMode = "dark",
): string {
  const fill = normalizeHexColor(sourceFill);
  if (mode === "dark") return fill;
  return mixHexWithWhite(fill, registry.lightTransform.fillMix);
}

/** Convert a mode-displayed fill back into the stored dark-source fill. */
export function glassFillToSource(
  modeFill: string,
  mode: GlassMaterialMode = "dark",
): string {
  const fill = normalizeHexColor(modeFill);
  if (mode === "dark") return fill;
  return unmixHexFromWhite(fill, registry.lightTransform.fillMix);
}

export function applyGlassMaterialMode(
  value: GlassMaterialParams,
  mode: GlassMaterialMode = "dark",
): GlassMaterialParams {
  const source = normalizeGlassMaterialParams(value);
  if (mode === "dark") return Object.freeze(source);
  if (mode !== "light") {
    throw new TypeError(`Unknown glass material mode "${String(mode)}".`);
  }

  const transform = registry.lightTransform;
  return Object.freeze(
    normalizeGlassMaterialParams({
      ...source,
      fill: glassFillForMode(source.fill, "light"),
      tint: source.tint * transform.tintScale + transform.tintOffset,
      blur: source.blur * transform.blurScale,
      chroma: source.chroma * transform.chromaScale,
      glow: source.glow * transform.glowScale,
      edgeHighlight: source.edgeHighlight * transform.edgeHighlightScale,
      specular: source.specular * transform.specularScale,
    }),
  );
}

export function resolveGlassMaterial(
  input: GlassMaterialInput = "regular",
  mode: GlassMaterialMode = "dark",
): GlassMaterialParams {
  let name: GlassMaterialName = "regular";
  let overrides: Partial<GlassMaterialParams> = {};

  if (typeof input === "string") {
    if (!isGlassMaterialName(input)) {
      throw new TypeError(`Unknown glass material preset "${input}".`);
    }
    name = input;
  } else if (input && typeof input === "object" && !Array.isArray(input)) {
    const { preset, ...rawOverrides } = input;
    if (preset !== undefined) {
      if (!isGlassMaterialName(preset)) {
        throw new TypeError(`Unknown glass material preset "${String(preset)}".`);
      }
      name = preset;
    }
    overrides = normalizeGlassMaterialOverrides(rawOverrides);
  } else {
    throw new TypeError("Glass material must be a preset name or an override object.");
  }

  const adapted = applyGlassMaterialMode(getGlassMaterialSource(name), mode);
  return Object.freeze(
    normalizeGlassMaterialParams({
      ...adapted,
      ...overrides,
    }),
  );
}

export function diffGlassMaterialParams(
  value: GlassMaterialParams,
  base: GlassMaterialParams,
): Partial<GlassMaterialParams> {
  const normalizedValue = normalizeGlassMaterialParams(value);
  const normalizedBase = normalizeGlassMaterialParams(base);
  const diff: Partial<GlassMaterialParams> = {};
  for (const key of glassMaterialKeys) {
    if (normalizedValue[key] !== normalizedBase[key]) {
      (diff as Record<string, number | string>)[key] = normalizedValue[key];
    }
  }
  return diff;
}

export function glassMaterialParamsEqual(
  a: GlassMaterialParams,
  b: GlassMaterialParams,
) {
  const normalizedA = normalizeGlassMaterialParams(a);
  const normalizedB = normalizeGlassMaterialParams(b);
  return glassMaterialKeys.every((key) => normalizedA[key] === normalizedB[key]);
}
