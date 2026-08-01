"use client";

import type { ReactNode } from "react";
import LiquidGlass from "../liquid-glass";
import type {
  GlassMaterialInput,
  GlassMaterialMode,
} from "../materials/materials";
import "./liquid-glass-compositions.css";

export type GlassIconPillProps = {
  children?: ReactNode;
  size?: number;
  className?: string;
  material?: GlassMaterialInput;
  materialMode?: GlassMaterialMode;
};

export function GlassIconPill({
  children,
  size = 48,
  className = "",
  material = "navigation",
  materialMode = "dark",
}: GlassIconPillProps) {
  return (
    <LiquidGlass
      width={size}
      height={size}
      borderRadius={size / 2}
      material={material}
      materialMode={materialMode}
      className={["glass-pill-surface", className].filter(Boolean).join(" ")}
    >
      {children}
    </LiquidGlass>
  );
}
