"use client";

import { motion } from "motion/react";
import type { HTMLMotionProps } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import LiquidGlass from "../liquid-glass";
import type { GlassEngineParams } from "../refraction/engine";
import type { GlassMaterialInput, GlassMaterialMode } from "../materials/materials";
import { useGlassSquish } from "./use-glass-squish";
import "./liquid-glass-compositions.css";

export type LiquidGlassCapsuleProps = {
  /** 基准尺寸（规格默认 210×150，静止 scaleY≈0.8 → 视觉高约 120）。 */
  width?: number;
  height?: number;
  borderRadius?: number;
  /** 初始绝对定位（相对 constraints 容器）。 */
  initial?: { x: number; y: number };
  /** Limit drag to a parent ref or pixel bounds. Default: unconstrained. */
  dragConstraints?: HTMLMotionProps<"div">["dragConstraints"];
  /** 透传给内部 GlassSurface 的材质预设或局部覆盖。 */
  material?: GlassMaterialInput;
  materialMode?: GlassMaterialMode;
  /** Dev-only engine preview overrides; not part of the material contract. */
  engine?: Partial<GlassEngineParams>;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
};

/**
 * 可运行的「液态玻璃胶囊」——挤压 & 拖动变形交互（kube.io 规格）。
 *
 * - 拖动使用自由位移，松手后停在当前位置，方便把玻璃移到不同背景上观察。
 * - 按压/拖动只改 CSS transform（x/y/scaleX/scaleY）与 box-shadow，贴图从不重算。
 * - 内部材质沿用项目已有的 {@link GlassSurface} 引擎。
 */
export function LiquidGlassCapsule({
  width = 210,
  height = 150,
  borderRadius = 75,
  initial,
  dragConstraints,
  material = "navigation",
  materialMode = "dark",
  engine,
  className,
  style,
  children,
}: LiquidGlassCapsuleProps) {
  const { pressed, velocityX: squishVelocityX, scaleX, scaleY, boxShadow } = useGlassSquish();

  return (
    <motion.div
      onPointerDown={(event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        pressed.set(true);
      }}
      drag
      dragConstraints={dragConstraints}
      dragMomentum={false}
      onDrag={(_, info) => squishVelocityX.set(info.velocity.x)}
      onDragEnd={() => squishVelocityX.set(0)}
      className={["absolute cursor-grab touch-none select-none active:cursor-grabbing", className]
        .filter(Boolean)
        .join(" ")}
      style={{ width, height, left: initial?.x, top: initial?.y, ...style }}
    >
      {/* 玻璃壳：只有它跟随挤压形变 + 阴影。 */}
      <motion.div
        style={{
          width: "100%",
          height: "100%",
          borderRadius,
          scaleX,
          scaleY,
          boxShadow,
        }}
      >
        <LiquidGlass
          width={width}
          height={height}
          borderRadius={borderRadius}
          material={material}
          materialMode={materialMode}
          engine={engine}
          className="glass-pill-surface"
        />
      </motion.div>

      {/* 内容覆盖层：不缩放、不被剪切，始终清晰。 */}
      {children ? (
        <div className="liquid-glass-capsule__content">{children}</div>
      ) : null}
    </motion.div>
  );
}
