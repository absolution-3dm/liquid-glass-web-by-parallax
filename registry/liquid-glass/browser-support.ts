export type BrowserIdentity = {
  userAgent: string;
  platform: string;
  maxTouchPoints: number;
};

export type GlassBrowserSupport = {
  isIOS: boolean;
  isSafari: boolean;
  isFirefox: boolean;
};

/**
 * The Chromium SVG-backdrop materials were tuned and visually approved on a
 * Retina display. Chromium currently applies `feDisplacementMap` through a
 * device-scale-dependent raster path, so the same CSS-pixel `scale` produces
 * a different result after a window moves between 1x and 2x displays.
 *
 * Keep this calibration separate from material presets and engine JSON: it is
 * a browser raster workaround, not an optical-material parameter.
 */
export const CHROMIUM_BACKDROP_REFERENCE_DPR = 2;

function validDevicePixelRatio(value: number): number {
  return Number.isFinite(value) && value > 0
    ? value
    : CHROMIUM_BACKDROP_REFERENCE_DPR;
}

/** Preserve the approved DPR-2 Chromium displacement appearance at any DPR. */
export function chromiumBackdropScaleCorrection(devicePixelRatio: number): number {
  return CHROMIUM_BACKDROP_REFERENCE_DPR / validDevicePixelRatio(devicePixelRatio);
}

/**
 * Watch DPR independently of layout size. Moving a window between displays can
 * keep the same CSS box, so ResizeObserver alone does not invalidate the SVG
 * filter or its displacement-map cache.
 */
export function observeDevicePixelRatio(
  onChange: (devicePixelRatio: number) => void,
): () => void {
  if (typeof window === "undefined") return () => {};

  let current = validDevicePixelRatio(window.devicePixelRatio);
  let resolutionQuery: MediaQueryList | null = null;

  const subscribe = () => {
    resolutionQuery?.removeEventListener("change", sync);
    resolutionQuery = window.matchMedia(`(resolution: ${current}dppx)`);
    resolutionQuery.addEventListener("change", sync);
  };

  const sync = () => {
    const next = validDevicePixelRatio(window.devicePixelRatio);
    if (next === current) return;
    current = next;
    onChange(next);
    subscribe();
  };

  onChange(current);
  subscribe();
  window.addEventListener("resize", sync, { passive: true });

  return () => {
    resolutionQuery?.removeEventListener("change", sync);
    window.removeEventListener("resize", sync);
  };
}

export function detectGlassBrowserSupport(
  identity: BrowserIdentity,
): GlassBrowserSupport {
  const { userAgent, platform, maxTouchPoints } = identity;
  const isIOS =
    /iPad|iPhone|iPod/.test(userAgent) ||
    (platform === "MacIntel" && maxTouchPoints > 1);

  return {
    isIOS,
    isSafari:
      isIOS || /^((?!chrome|chromium|android).)*safari/i.test(userAgent),
    isFirefox: /Firefox/.test(userAgent),
  };
}

function currentBrowserIdentity(): BrowserIdentity {
  if (typeof navigator === "undefined") {
    return { userAgent: "", platform: "", maxTouchPoints: 0 };
  }

  return {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
  };
}

export const glassBrowserSupport = detectGlassBrowserSupport(
  currentBrowserIdentity(),
);

let backdropSvgSupport: boolean | null = null;

/**
 * Chromium-only capability gate for SVG reference filters on backdrops.
 * Safari and Firefox deliberately stay on the honest CSS blur fallback.
 */
export function supportsBackdropSvgFilter(): boolean {
  if (backdropSvgSupport !== null) return backdropSvgSupport;
  if (typeof window === "undefined" || typeof document === "undefined") {
    return false;
  }
  if (
    glassBrowserSupport.isSafari ||
    glassBrowserSupport.isFirefox
  ) {
    backdropSvgSupport = false;
    return false;
  }

  const probe = document.createElement("div");
  probe.style.backdropFilter = "url(#liquid-glass-backdrop-probe)";
  backdropSvgSupport = probe.style.backdropFilter !== "";
  return backdropSvgSupport;
}
