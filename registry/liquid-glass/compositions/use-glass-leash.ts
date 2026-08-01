"use client";

import { useCallback, useEffect, useRef } from "react";
import { useMotionValue, type MotionValue } from "motion/react";
import type { PointerEvent as ReactPointerEvent } from "react";

/**
 * 液态玻璃胶囊的「预应力弹簧」拖拽：胶囊始终锚定在静止位（偏移 0,0）。
 *
 * 核心原则：
 * - 从第一像素起就有回复力——不是「自由拖动，触边才有阻力」的硬边界观感。
 *   拖动量先乘 {@link RESISTANCE}（<1），一开始就比手慢，全程都在「拽」，
 *   不会出现「前段完全跟手、后段突然拖不动」的两段式割裂感。
 * - 用拖动矢量的模长（而非 x/y 分别）过 tanh 渐近，渐近区因此是以
 *   {@link MAX_TRAVEL_PX} 为半径的圆，不是方形——斜向拖和水平/竖直拖手感一致。
 * - 松手（或拖动力归零）时，弹簧把偏移拉回锚点，阻尼比 < 1 带一点回弹感。
 *
 * 实现：window 上监听 pointermove 算出相对按下点的位移 dx/dy，映射成
 * 渐近的目标偏移，再用与 {@link ios-pointer.tsx} 一致的半隐式欧拉弹簧
 * 积分到 x/y，让跟随和回弹都平滑、可预测。
 */
const MAX_TRAVEL_PX = 14; // 渐近半径：拖多远都不会超过这个偏移（圆形边界）
const RESISTANCE = 0.45; // 拖动量到目标偏移的起始比例——从第一像素就打折，而非到顶才打折
const SPRING_STIFFNESS = 460; // 更硬的弹簧：回弹更快、更「弹」
const SPRING_DAMPING = 18; // 阻尼比 ≈0.42（欠阻尼）：松手回弹带轻微回弹感
const SPRING_MASS = 1;
const SETTLE_EPS = 0.02;

export type GlassLeash = {
  /** 相对锚点的偏移（px），叠加到静止位置上即为视觉位置。 */
  x: MotionValue<number>;
  y: MotionValue<number>;
  /** 弹簧速度，供果冻挤压效果复用（拖得快/拖得远都会顶到同一个 V_MAX）。 */
  velocityX: MotionValue<number>;
  onPointerDown: (event: ReactPointerEvent) => void;
};

export function useGlassLeash(): GlassLeash {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const velocityX = useMotionValue(0);

  const state = useRef({
    dragging: false,
    originX: 0,
    originY: 0,
    targetX: 0,
    targetY: 0,
    vx: 0,
    vy: 0,
    frame: null as number | null,
    lastTime: null as number | null,
  });

  const tick = useCallback(
    (time: number) => {
      const s = state.current;
      s.frame = null;
      const elapsed = s.lastTime === null ? 1 / 60 : (time - s.lastTime) / 1000;
      const dt = Math.min(0.032, Math.max(1 / 240, elapsed));
      s.lastTime = time;

      const curX = x.get();
      const curY = y.get();
      const ax =
        (-SPRING_STIFFNESS * (curX - s.targetX) - SPRING_DAMPING * s.vx) / SPRING_MASS;
      const ay =
        (-SPRING_STIFFNESS * (curY - s.targetY) - SPRING_DAMPING * s.vy) / SPRING_MASS;
      s.vx += ax * dt;
      s.vy += ay * dt;
      const nextX = curX + s.vx * dt;
      const nextY = curY + s.vy * dt;
      x.set(nextX);
      y.set(nextY);
      velocityX.set(s.vx);

      const settled =
        !s.dragging &&
        Math.abs(nextX - s.targetX) < SETTLE_EPS &&
        Math.abs(nextY - s.targetY) < SETTLE_EPS &&
        Math.abs(s.vx) < SETTLE_EPS &&
        Math.abs(s.vy) < SETTLE_EPS;

      if (settled) {
        x.set(s.targetX);
        y.set(s.targetY);
        velocityX.set(0);
        return;
      }
      s.frame = requestAnimationFrame(tick);
    },
    [velocityX, x, y],
  );

  const ensureRunning = useCallback(() => {
    const s = state.current;
    if (s.frame !== null) return;
    s.lastTime = null;
    s.frame = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    const s = state.current;

    const handleMove = (event: PointerEvent) => {
      if (!s.dragging) return;
      const dx = event.clientX - s.originX;
      const dy = event.clientY - s.originY;
      const r = Math.hypot(dx, dy);
      if (r < 1e-4) {
        s.targetX = 0;
        s.targetY = 0;
      } else {
        // 矢量模长过渐近曲线（先打折再饱和），映射结果按原方向缩放回 x/y——
        // 渐近区域因此是以 MAX_TRAVEL_PX 为半径的圆，斜拖不会比横/竖拖更远。
        const mappedR = MAX_TRAVEL_PX * Math.tanh((r * RESISTANCE) / MAX_TRAVEL_PX);
        const scale = mappedR / r;
        s.targetX = dx * scale;
        s.targetY = dy * scale;
      }
      ensureRunning();
    };

    const endDrag = () => {
      if (!s.dragging) return;
      s.dragging = false;
      s.targetX = 0;
      s.targetY = 0;
      ensureRunning();
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerup", endDrag, { passive: true });
    window.addEventListener("pointercancel", endDrag, { passive: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
      if (s.frame !== null) cancelAnimationFrame(s.frame);
    };
  }, [ensureRunning]);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      const s = state.current;
      s.dragging = true;
      s.originX = event.clientX;
      s.originY = event.clientY;
      ensureRunning();
    },
    [ensureRunning],
  );

  return { x, y, velocityX, onPointerDown };
}

