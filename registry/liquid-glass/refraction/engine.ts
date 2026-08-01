import type { LensMapParams } from "./lens-map";
import { clampBevelDepth, refrPowFromCurvature } from "./math";
import engineConfig from "./engine.json";

export type GlassEngineParams = {
  /** Minimum displacement-map long-edge resolution in pixels. */
  mapQuality: number;
  glowSpread: number;
  glowExponent: number;
  edgeWidth: number;
  edgeExponent: number;
  chromaRedBoost: number;
  chromaGreenBoost: number;
  backdropBlurPadMultiplier: number;
  backdropBlurPadExtra: number;
  backdropSaturateSvg: number;
  backdropSaturateCssBlur: number;
  /**
   * Multiplier applied to material `blur` on the CSS `backdrop-filter: blur()`
   * fallback (Safari / Firefox). SVG displacement carries the look on Chromium;
   * without a boost, blur≈1 reads as a flat tint veil.
   */
  cssBlurFallbackMultiplier: number;
  specularMaskAlphaOffset: number;
  /** Brightness of the glare arc opposite the light, 0–1 (studio glare). */
  glareOppositeFactor: number;
  /**
   * How much of the highlight brightens the refracted background
   * (hue-preserving, screen-like) instead of adding flat white, 0–1.
   */
  specularColorPreserve: number;
};

/**
 * Shared liquid-glass engine constants (Aave technique).
 * Material tuning lives in `materials.json`.
 * Consumers may provide per-instance overrides through the primitive's
 * `engine` prop; the checked-in JSON remains the source-owned default.
 */
export const glassEngine = engineConfig satisfies GlassEngineParams;

/** Shared pointer-light tuning for the LiquidGlass surface and SVG graph. */
export const glassPointerHighlight = {
  radius: 84,
  saturation: 1.16,
  brightness: 1.08,
  bloomOpacity: 0.16,
  hoverStrength: 0.34,
  pressedStrength: 0.58,
  coreStop: 0.14,
  shoulderStop: 0.42,
  shoulderOpacity: 0.58,
  outerStop: 0.64,
  outerOpacity: 0.2,
  endStop: 0.86,
} as const;

const pointerMaskSize = glassPointerHighlight.radius * 2;
export const glassPointerHighlightMaskUrl = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pointerMaskSize} ${pointerMaskSize}"><defs><radialGradient id="g"><stop offset="0%" stop-color="white"/><stop offset="${glassPointerHighlight.coreStop * 100}%" stop-color="white"/><stop offset="${glassPointerHighlight.shoulderStop * 100}%" stop-color="white" stop-opacity="${glassPointerHighlight.shoulderOpacity}"/><stop offset="${glassPointerHighlight.outerStop * 100}%" stop-color="white" stop-opacity="${glassPointerHighlight.outerOpacity}"/><stop offset="${glassPointerHighlight.endStop * 100}%" stop-color="white" stop-opacity="0"/></radialGradient></defs><rect width="${pointerMaskSize}" height="${pointerMaskSize}" fill="url(#g)"/></svg>`,
)}`;

export function glassEngineSnapshot(): GlassEngineParams {
  return { ...glassEngine };
}

export function resolveGlassEngine(overrides?: Partial<GlassEngineParams>): GlassEngineParams {
  if (!overrides) return glassEngineSnapshot();
  return { ...glassEngine, ...overrides };
}

export type GlassLensMaterial = {
  depth: number;
  curvature: number;
  splay: number;
  glow: number;
  edgeHighlight: number;
  specularAngle: number;
};

export function clampUnit(value: number) {
  return Math.max(0, Math.min(1, value));
}

export function clampChroma(chroma: number) {
  return clampUnit(chroma);
}

/** Force an even positive size (lens map mirrors each axis around its midpoint). */
export function evenMapSize(value: number) {
  const n = Math.max(2, Math.round(value));
  return n + (n % 2);
}

/**
 * Resolve an aspect-correct displacement bitmap for an element.
 * `mapQuality` is the long-edge floor; larger elements and DPR can increase
 * it up to `maxQuality`. The short edge follows the same uniform scale, so
 * the SVG filter never has to non-uniformly stretch a square map.
 *
 * `dpr` bakes extra samples for high-density screens: `width`/`height` are
 * CSS px, but a map sized to CSS px alone gets stretched across `dpr`×as
 * many physical pixels on a Retina/mobile screen, softening exactly the rim
 * detail (corner bevel, specular arcs) this map exists to carry — most
 * visible the bigger the surface gets. Left at the default of 1 (no boost)
 * for any caller that bakes on every animation frame (e.g. a resizing
 * GlassSurface mid-spring); pass a real `dpr` only for one-shot/settled
 * bakes, where a few-KB-bigger canvas+PNG cost is a one-time expense rather
 * than a per-frame one.
 */
export function mapDimensionsForElement(
  width: number,
  height: number,
  baseQuality: number,
  maxQuality = 1024,
  dpr = 1,
): { width: number; height: number } {
  const safeWidth = Math.max(1, width);
  const safeHeight = Math.max(1, height);
  const longerCssEdge = Math.max(safeWidth, safeHeight);
  const longEdge = evenMapSize(
    Math.min(
      evenMapSize(maxQuality),
      Math.max(baseQuality, longerCssEdge * Math.max(1, dpr)),
    ),
  );
  const scale = longEdge / longerCssEdge;

  if (safeWidth >= safeHeight) {
    return {
      width: longEdge,
      height: evenMapSize(safeHeight * scale),
    };
  }

  return {
    width: evenMapSize(safeWidth * scale),
    height: longEdge,
  };
}

/**
 * Caps the boost from {@link mapDimensionsForElement}'s `dpr` param at 3x: real
 * device pixel ratios don't exceed that on any current phone, and capping
 * lower than the device's actual ratio (this used to cap at 2, which still
 * under-bakes a 3x-DPR iPhone) defeats the point of matching device pixels
 * in the first place — the corner/rim detail this map carries needs to be
 * sampled at least as densely as the screen it's stretched across, or the
 * curved edge visibly facets.
 */
export function mapBakeDpr(): number {
  if (typeof window === "undefined") return 1;
  return Math.min(window.devicePixelRatio || 1, 3);
}

export function chromaticChannelScales(
  baseScale: number,
  chroma: number,
  engine: GlassEngineParams = glassEngine,
) {
  const c = clampChroma(chroma);
  return {
    red: baseScale * (1 + engine.chromaRedBoost * c),
    green: baseScale * (1 + engine.chromaGreenBoost * c),
    blue: baseScale,
  };
}

/**
 * feDisplacementMap pixel scale from material `scale`, relative to the lens's
 * short edge. Using the diagonal here makes a capsule's vertical refraction
 * grow with its width, so equal-height pills appear to have different glass
 * thicknesses. The short edge keeps the local bevel response invariant across
 * aspect ratios while preserving the existing square/circle scale exactly.
 * Fold safety comes from the normalized bevel-slope map, not from capping here.
 */
export function refractionBackdropScale(strength: number, width: number, height: number) {
  const shortEdge = Math.min(Math.max(0, width), Math.max(0, height));
  return Math.max(0, strength) * shortEdge;
}

/**
 * Each color channel has two isolated-axis branches: Y→X for the horizontal
 * edges and X→Y for the vertical edges. This keeps the edge's tangential axis
 * last without ever putting X and Y into the same displacement primitive.
 */
export const AXIS_PASSES_PER_CHANNEL = 4;

export function backdropFilterPadding(blurPx: number, engine: GlassEngineParams = glassEngine) {
  return (
    Math.ceil(Math.max(0, blurPx) * engine.backdropBlurPadMultiplier) + engine.backdropBlurPadExtra
  );
}

/**
 * CSS `backdrop-filter: blur()` fallback strength. Material `blur` is tuned for
 * the SVG displacement path (~1px frost before displace); Safari/Firefox need
 * a much stronger blur to read as glass instead of a flat tint veil.
 */
export function cssBackdropBlurPx(
  blur: number,
  engine: GlassEngineParams = glassEngine,
) {
  return Math.max(0, blur) * Math.max(1, engine.cssBlurFallbackMultiplier);
}

export function buildLensMapParams(
  args: {
    halfWidth: number;
    halfHeight: number;
    radius: number;
    material: GlassLensMaterial;
  },
  engine: GlassEngineParams = glassEngine,
  /** See {@link mapDimensionsForElement}'s `dpr` param — defaults to no boost. */
  dpr = 1,
  /** See {@link mapDimensionsForElement}'s `maxQuality` param. */
  maxQuality = 1024,
): LensMapParams {
  const { halfWidth: hw, halfHeight: hh, radius, material } = args;

  const dimensions = mapDimensionsForElement(
    hw * 2,
    hh * 2,
    engine.mapQuality,
    maxQuality,
    dpr,
  );

  return {
    width: dimensions.width,
    height: dimensions.height,
    halfWidth: hw,
    halfHeight: hh,
    radius,
    depth: clampBevelDepth(material.depth, hw, hh),
    refrPow: refrPowFromCurvature(material.curvature),
    splay: clampUnit(material.splay),
    glow: Math.max(0, material.glow),
    glowSpread: engine.glowSpread,
    glowExponent: engine.glowExponent,
    edgeHighlight: Math.max(0, material.edgeHighlight),
    edgeWidth: engine.edgeWidth,
    edgeExponent: engine.edgeExponent,
    specularAngle: material.specularAngle,
    glareOppositeFactor: clampUnit(engine.glareOppositeFactor),
  };
}

/**
 * Splits the specular energy between two passes:
 * k1 — applied INSIDE the backdrop filter (`k1·mask·refractedBg + bg`), so
 * the highlight brightens the refracted background and keeps its hue
 * (liquid-glass-studio boosts LCH lightness the same way). ×2 compensates
 * the term reading at half strength on a mid-gray backdrop.
 * k2 — flat additive white in the content filter (whose input is only the
 * tint layer, so it cannot see the background). CSS-blur fallbacks have no
 * SVG backdrop pass and should use the full `specular` as k2 instead.
 */
export function specularCompositeCoefficients(
  specular: number,
  engine: GlassEngineParams = glassEngine,
) {
  const preserve = clampUnit(engine.specularColorPreserve);
  const strength = Math.max(0, specular);
  return {
    // Additional color glow on the refracted background — ×3 because the
    // term scales with the (usually dark) backdrop luminance.
    k1: strength * preserve * 3,
    // White share stays dominant so the highlight anchors on dark
    // backgrounds too (studio's LCH boost saturates toward white as well).
    k2: strength * (1 - preserve * 0.35),
  };
}

export function specularMaskColorMatrixValues(engine: GlassEngineParams = glassEngine) {
  return `0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 1 0 ${engine.specularMaskAlphaOffset}`;
}

export function glassSurfaceCssVars(
  tint: number,
  fill: string = "#000000",
  engine: GlassEngineParams = glassEngine,
) {
  return {
    "--glass-tint": String(tint),
    "--glass-fill": fill,
    "--glass-backdrop-saturate-svg": String(engine.backdropSaturateSvg),
    "--glass-backdrop-saturate-blur": String(engine.backdropSaturateCssBlur),
    "--glass-pointer-radius": `${glassPointerHighlight.radius}px`,
    "--glass-pointer-saturation": String(glassPointerHighlight.saturation),
    "--glass-pointer-brightness": String(glassPointerHighlight.brightness),
    "--glass-pointer-bloom-opacity": String(glassPointerHighlight.bloomOpacity),
    "--glass-pointer-core-stop": `${glassPointerHighlight.coreStop * 100}%`,
    "--glass-pointer-shoulder-stop": `${glassPointerHighlight.shoulderStop * 100}%`,
    "--glass-pointer-shoulder-opacity": String(glassPointerHighlight.shoulderOpacity),
    "--glass-pointer-outer-stop": `${glassPointerHighlight.outerStop * 100}%`,
    "--glass-pointer-outer-opacity": String(glassPointerHighlight.outerOpacity),
    "--glass-pointer-end-stop": `${glassPointerHighlight.endStop * 100}%`,
  } as const;
}
