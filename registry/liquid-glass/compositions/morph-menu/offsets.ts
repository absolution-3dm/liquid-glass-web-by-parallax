import type { CSSProperties } from "react";

export type Direction = "top" | "bottom" | "left" | "right";
export type Anchor = "start" | "center" | "end";

/** Anchor the absolute shell to the closed-slot corner for the open direction. */
export function shellAnchorStyle(direction: Direction): CSSProperties {
  const style: CSSProperties = { position: "absolute" };
  switch (direction) {
    case "top":
      style.bottom = 0;
      style.left = 0;
      break;
    case "bottom":
      style.top = 0;
      style.left = 0;
      break;
    case "left":
      style.right = 0;
      style.bottom = 0;
      break;
    case "right":
      style.left = 0;
      style.bottom = 0;
      break;
  }
  return style;
}

/** Shift so `anchor: end|center` keeps the closed pill edge aligned while width/height grow. */
export function anchorShift(
  direction: Direction,
  anchor: Anchor,
  menuWidth: number,
  menuHeight: number,
  buttonWidth: number,
  buttonHeight: number,
): { x: number; y: number } {
  if (anchor === "start") return { x: 0, y: 0 };
  const factor = anchor === "center" ? 0.5 : 1;
  if (direction === "top" || direction === "bottom") {
    return { x: -(menuWidth - buttonWidth) * factor, y: 0 };
  }
  return { x: 0, y: (menuHeight - buttonHeight) * factor };
}

/** Gap between closed pill and open panel along the open direction. */
export function directionOffset(
  direction: Direction,
  offsetPx: number,
): { x: number; y: number } {
  switch (direction) {
    case "top":
      return { y: -offsetPx, x: 0 };
    case "bottom":
      return { y: offsetPx, x: 0 };
    case "left":
      return { x: -offsetPx, y: 0 };
    case "right":
      return { x: offsetPx, y: 0 };
  }
}

export function contentEnterOffset(
  direction: Direction,
  distance: number,
): { x: number; y: number } {
  switch (direction) {
    case "top":
      return { x: 0, y: distance };
    case "bottom":
      return { x: 0, y: -distance };
    case "left":
      return { x: distance, y: 0 };
    case "right":
      return { x: -distance, y: 0 };
  }
}

