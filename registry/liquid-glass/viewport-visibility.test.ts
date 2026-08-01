import { describe, expect, it } from "vitest";
import {
  GLASS_VIEWPORT_ROOT_MARGIN_PX,
  isElementNearViewport,
} from "./viewport-visibility";

const viewport = { width: 1280, height: 800 };

function box(top: number, height = 80) {
  return {
    getBoundingClientRect: () => ({
      top,
      left: 40,
      bottom: top + height,
      right: 200,
      width: 160,
      height,
      x: 40,
      y: top,
      toJSON: () => ({}),
    }),
  } as Element;
}

describe("viewport visibility", () => {
  it("treats an on-screen box as near the viewport", () => {
    expect(isElementNearViewport(box(40), GLASS_VIEWPORT_ROOT_MARGIN_PX, viewport)).toBe(
      true,
    );
  });

  it("keeps a just-below-fold box near when within root margin", () => {
    expect(
      isElementNearViewport(
        box(viewport.height + GLASS_VIEWPORT_ROOT_MARGIN_PX - 1),
        GLASS_VIEWPORT_ROOT_MARGIN_PX,
        viewport,
      ),
    ).toBe(true);
  });

  it("marks a far below-fold box as not near", () => {
    expect(
      isElementNearViewport(
        box(viewport.height + GLASS_VIEWPORT_ROOT_MARGIN_PX + 40),
        GLASS_VIEWPORT_ROOT_MARGIN_PX,
        viewport,
      ),
    ).toBe(false);
  });
});
