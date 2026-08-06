import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CHROMIUM_BACKDROP_REFERENCE_DPR,
  chromiumBackdropScaleCorrection,
  detectGlassBrowserSupport,
  observeDevicePixelRatio,
} from "./browser-support";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("glass browser support", () => {
  it("preserves the approved DPR-2 Chromium displacement scale", () => {
    expect(CHROMIUM_BACKDROP_REFERENCE_DPR).toBe(2);
    expect(chromiumBackdropScaleCorrection(1)).toBe(2);
    expect(chromiumBackdropScaleCorrection(1.5)).toBeCloseTo(4 / 3);
    expect(chromiumBackdropScaleCorrection(2)).toBe(1);
    expect(chromiumBackdropScaleCorrection(3)).toBeCloseTo(2 / 3);
  });

  it("falls back to the reference DPR for invalid scale factors", () => {
    expect(chromiumBackdropScaleCorrection(0)).toBe(1);
    expect(chromiumBackdropScaleCorrection(Number.NaN)).toBe(1);
  });

  it("reports cross-display DPR changes even when layout size is unchanged", () => {
    let devicePixelRatio = 2;
    let resizeListener: (() => void) | null = null;
    const resolutionListeners = new Set<() => void>();
    const matchMedia = vi.fn((query: string) => ({
      media: query,
      matches: true,
      addEventListener: (_type: string, listener: () => void) => {
        resolutionListeners.add(listener);
      },
      removeEventListener: (_type: string, listener: () => void) => {
        resolutionListeners.delete(listener);
      },
    }));

    vi.stubGlobal("window", {
      get devicePixelRatio() {
        return devicePixelRatio;
      },
      matchMedia,
      addEventListener: (type: string, listener: () => void) => {
        if (type === "resize") resizeListener = listener;
      },
      removeEventListener: (type: string, listener: () => void) => {
        if (type === "resize" && resizeListener === listener) resizeListener = null;
      },
    });

    const observed: number[] = [];
    const stop = observeDevicePixelRatio((dpr) => observed.push(dpr));
    expect(observed).toEqual([2]);
    expect(matchMedia).toHaveBeenLastCalledWith("(resolution: 2dppx)");

    devicePixelRatio = 1;
    (resizeListener as (() => void) | null)?.();
    expect(observed).toEqual([2, 1]);
    expect(matchMedia).toHaveBeenLastCalledWith("(resolution: 1dppx)");

    stop();
    expect(resizeListener).toBeNull();
    expect(resolutionListeners.size).toBe(0);
  });

  it("keeps desktop and iOS Safari on the fallback path", () => {
    expect(
      detectGlassBrowserSupport({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Version/18.5 Safari/605.1.15",
        platform: "MacIntel",
        maxTouchPoints: 0,
      }),
    ).toMatchObject({ isSafari: true, isIOS: false, isFirefox: false });

    expect(
      detectGlassBrowserSupport({
        userAgent:
          "Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1",
        platform: "iPhone",
        maxTouchPoints: 5,
      }),
    ).toMatchObject({ isSafari: true, isIOS: true, isFirefox: false });
  });

  it("detects iPadOS desktop UA and Firefox without classifying Chrome as Safari", () => {
    expect(
      detectGlassBrowserSupport({
        userAgent:
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15",
        platform: "MacIntel",
        maxTouchPoints: 5,
      }).isIOS,
    ).toBe(true);

    expect(
      detectGlassBrowserSupport({
        userAgent: "Mozilla/5.0 Firefox/141.0",
        platform: "Linux x86_64",
        maxTouchPoints: 0,
      }).isFirefox,
    ).toBe(true);

    expect(
      detectGlassBrowserSupport({
        userAgent:
          "Mozilla/5.0 AppleWebKit/537.36 Chrome/140.0.0.0 Safari/537.36",
        platform: "Linux x86_64",
        maxTouchPoints: 0,
      }).isSafari,
    ).toBe(false);
  });
});
