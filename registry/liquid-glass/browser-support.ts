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
