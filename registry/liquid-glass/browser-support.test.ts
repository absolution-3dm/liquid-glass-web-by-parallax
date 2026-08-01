import { describe, expect, it } from "vitest";
import { detectGlassBrowserSupport } from "./browser-support";

describe("glass browser support", () => {
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
