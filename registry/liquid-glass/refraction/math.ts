/** Fast error-function approximation (legacy rim falloff / tests). */
export function erf(x: number): number {
  return Math.tanh(1.7724538509 * x);
}

export function clamp01(value: number) {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/**
 * Soft knee: identity below `limit`, then asymptotically approaches without a hard clip.
 */
export function softKnee(value: number, limit = 1) {
  const a = Math.abs(value);
  if (a <= limit) return value;
  const excess = a - limit;
  return Math.sign(value) * (limit + excess / (1 + excess));
}

/**
 * Quilez rounded-box SDF (https://iquilezles.org/articles/distfunctions2d/).
 * `p` is centered; `half` is half-extents; `radius` is corner radius.
 * Negative inside, positive outside.
 */
export function sdRoundedBox(
  px: number,
  py: number,
  halfW: number,
  halfH: number,
  radius: number,
): number {
  const r = Math.min(radius, Math.min(halfW, halfH));
  const qx = Math.abs(px) - halfW + r;
  const qy = Math.abs(py) - halfH + r;
  const ox = qx > 0 ? qx : 0;
  const oy = qy > 0 ? qy : 0;
  const outside = ox * ox + oy * oy > 0 ? Math.hypot(ox, oy) : 0;
  const inside = Math.min(Math.max(qx, qy), 0);
  return outside + inside - r;
}

/**
 * Outward unit normal of a rounded box in the first quadrant (ax, ay ≥ 0).
 * Analytic ∇ of `sdRoundedBox`.
 */
export function roundedBoxNormalAbs(
  ax: number,
  ay: number,
  halfW: number,
  halfH: number,
  radius: number,
): { nx: number; ny: number } {
  const r = Math.min(radius, Math.min(halfW, halfH));
  const qx = ax - halfW + r;
  const qy = ay - halfH + r;

  if (qx > 0 && qy > 0) {
    const len = Math.hypot(qx, qy) || 1;
    return { nx: qx / len, ny: qy / len };
  }
  if (qx > qy) return { nx: 1, ny: 0 };
  return { nx: 0, ny: 1 };
}

/**
 * Ybouane liquidglass circular-bevel height field (pill / "ripple" cross-section).
 * `d` = distance inside from the silhouette (−sdf); `zR` = bevel depth (zRadius).
 *
 * @see https://github.com/ybouane/liquidglass/blob/main/src/shaders.ts
 */
export function bevelHeight(d: number, zR: number): number {
  if (d <= 0 || zR <= 0) return 0;
  if (d >= zR) return zR;
  return Math.sqrt(d * (2 * zR - d));
}

/**
 * Analytic slope dh/dd of {@link bevelHeight}.
 * Floors `d` to ~1px so the rim asymptote stays finite (matches ybouane's e≈2 FD bound).
 * Zero on the flat plateau (`d ≥ zR`) and outside.
 */
export function bevelSlope(d: number, zR: number): number {
  if (zR <= 0 || d < 0 || d >= zR) return 0;
  const dSafe = Math.max(d, 1);
  if (dSafe >= zR) return 0;
  const h = Math.sqrt(dSafe * (2 * zR - dSafe));
  if (h < 1e-6) return 0;
  return (zR - dSafe) / h;
}

/**
 * Cap bevel depth (zRadius) to the element inradius so opposite edges keep a
 * flat plateau. Without this, depth ≫ min(halfW, halfH) makes the circular
 * bevel fill the whole pill and paints a hard medial seam.
 */
export function clampBevelDepth(depth: number, halfWidth: number, halfHeight: number): number {
  const inradius = Math.min(halfWidth, halfHeight);
  // Leave ≥1px of flat centre when the element is large enough.
  const maxDepth = Math.max(0, inradius - 1);
  return Math.min(Math.max(0, depth), maxDepth);
}

/**
 * Small-angle Snell factor `1 - 1/ior` from material curvature → IOR.
 * curvature 0→1 maps to ior ≈ 1.15→2.5 (same range as former refFactor).
 */
export function refrPowFromCurvature(curvature: number): number {
  const ior = 1.15 + clamp01(curvature) * 1.35;
  return 1 - 1 / ior;
}

/** @deprecated Use {@link refrPowFromCurvature}; kept for call-site compatibility. */
export function refFactorFromCurvature(curvature: number) {
  return 1.15 + clamp01(curvature) * 1.35;
}

export type DomeConstants = {
  Rx: number;
  Ry: number;
  scaleX: number;
  scaleY: number;
};

/**
 * @deprecated Prefer ybouane {@link bevelHeight} / {@link bevelSlope}.
 */
function averageDomeGradient(R: number, half: number): number {
  let sum = 0;
  for (let i = 0; i <= 200; i++) {
    const s = (i / 200) * half;
    const v = s / Math.sqrt(R * R - s * s);
    sum += i === 0 || i === 200 ? 0.5 * v : v;
  }
  return sum / 200;
}

/** Sphere radii + normalization for a dome of `depth` px over the lens. */
export function computeDomeConstants(
  depth: number,
  halfWidth: number,
  halfHeight: number,
): DomeConstants {
  const d = Math.max(0.01, Math.min(depth, Math.min(halfWidth, halfHeight) - 1));
  const Rx = (halfWidth * halfWidth + d * d) / (2 * d);
  const Ry = (halfHeight * halfHeight + d * d) / (2 * d);
  const gx = averageDomeGradient(Rx, halfWidth);
  const gy = averageDomeGradient(Ry, halfHeight);
  return {
    Rx,
    Ry,
    scaleX: gx > 0 ? 0.5 / gx : 1,
    scaleY: gy > 0 ? 0.5 / gy : 1,
  };
}

/** Surface gradient of the dome at offset `x` from the lens center. */
export function domeGradient(x: number, R: number, scale: number): number {
  const s = Math.min(x, 0.999 * R);
  return (s / Math.sqrt(R * R - s * s)) * scale;
}
