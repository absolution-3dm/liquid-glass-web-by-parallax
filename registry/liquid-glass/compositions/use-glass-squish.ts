"use client";

import { useEffect, useRef } from "react";
import {
  animate,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "motion/react";

/**
 * Liquid-glass 胶囊的「挤压 & 拉伸」交互（Apple-like 手感）。
 *
 * 核心原则：
 * - 中性态 = 真实形状（scaleX = scaleY = 1），形变只是对交互的瞬时偏离，松手弹回。
 * - 按住 = 轻微下压（体积守恒：Y 压多少，X 补多少），像戴按果冻。
 * - 快速拖动 = 沿运动方向拉长（同样体积守恒），幅度受 {@link C_MAX} 限制，
 *   避免 CSS 缩放已烘焙的位移图时折射被明显拉伸。
 * - 贴图从不重算——只用 CSS transform 视觉形变 + box-shadow 反馈。
 *
 * 实现方式：用 `useMotionValueEvent` 监听 pressed / velocityX，命令式
 * `animate(mv, target, spring)` 以弹簧驱动普通 `useMotionValue`。这条链路最直接，
 * 不依赖「useSpring 跟随另一个 motion value」等隐式订阅行为，便于确定性调试。
 * （注：预览标签页在隐藏时会暂停 requestAnimationFrame，弹簧动画不推进——
 * 验证动画需触发真实重绘，别只靠 setTimeout 轮询。）
 *
 * 用法：把返回的 motion value 挂到承载胶囊形状的**玻璃壳** `motion.div` 上
 * （不要包住内容，内容应作为不缩放的覆盖层单独叠放），按下时 `pressed.set(true)`
 * （松开由本 hook 的全局监听复位），拖动时把水平速度写入 `velocityX`（松手归 0）。
 */
export type GlassSquish = {
  /** 按压状态：按下 true / 松开 false（松开的复位挂在 window 上）。 */
  pressed: MotionValue<boolean>;
  /** 当前拖动水平速度 px/s，用于「沿方向拉长」的果冻形变。 */
  velocityX: MotionValue<number>;
  scaleX: MotionValue<number>;
  scaleY: MotionValue<number>;
  boxShadow: MotionValue<string>;
};

// 形变量参数（体积守恒：scaleY = 1 − c, scaleX = 1 + c）。
const PRESS_SQUASH = 0.06; // 按住的下压量
const JELLY_GAIN = 0.1; // 速度触顶时额外贡献的压缩量
const V_MAX = 4000; // px/s：速度到这就触顶
const C_MAX = 0.12; // 总压缩上限 → scaleX ≤ 1.12, scaleY ≥ 0.88
// 速度低通滤波系数（EMA）：越小越平滑但越滞后。原始速度采样在快速拖动时会出现
// 尖峰（尤其 delta/dt 那种算法 dt 极小时会爆），直接喂给压缩量会让形状跳变，
// 这里先把速度磨平再算 c。
const V_SMOOTH = 0.25;

const SCALE_SPRING = { type: "spring", stiffness: 340, damping: 30 } as const;
const SHADOW_SPRING = { type: "spring", stiffness: 300, damping: 26 } as const;

/** 体积守恒的总压缩量 c。 */
function compress(pressed: boolean, velocityX: number): number {
  const base = pressed ? PRESS_SQUASH : 0;
  const speed = Math.min(Math.abs(velocityX), V_MAX);
  return Math.min(C_MAX, base + JELLY_GAIN * (speed / V_MAX));
}

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** press 进度 0→1 插值出的 box-shadow：按住「被抓起」→ 投影变大、内阴影加深。 */
function shadowFor(p: number): string {
  const x = lerp(0, 4, p);
  const y = lerp(4, 16, p);
  const b = lerp(9, 24, p);
  const d = lerp(0.16, 0.22, p); // 外阴影黑色 alpha
  const i = lerp(0.2, 0.27, p); // 内阴影 alpha
  return (
    `${x}px ${y}px ${b}px rgba(0,0,0,${d}), ` +
    `inset ${x / 2}px ${y / 2}px 24px rgba(0,0,0,${i}), ` +
    `inset ${-x / 2}px ${-y / 2}px 24px rgba(255,255,255,${i})`
  );
}

export function useGlassSquish(): GlassSquish {
  const pressed = useMotionValue(false);
  const velocityX = useMotionValue(0);

  // 普通 motion value，中性态 = 1（真实形状）。用 animate() 以弹簧驱动。
  const scaleX = useMotionValue(1);
  const scaleY = useMotionValue(1);
  const shadowProgress = useMotionValue(0);

  // 低通滤波后的速度：磨掉原始采样的尖峰，避免快速拖动时压缩量突变。
  const smoothV = useRef(0);

  const applyCompression = (smoothedVelocity: number) => {
    const c = compress(pressed.get(), smoothedVelocity);
    animate(scaleX, 1 + c, SCALE_SPRING); // 体积守恒
    animate(scaleY, 1 - c, SCALE_SPRING);
  };
  useMotionValueEvent(pressed, "change", () => {
    applyCompression(smoothV.current);
    animate(shadowProgress, pressed.get() ? 1 : 0, SHADOW_SPRING);
  });
  useMotionValueEvent(velocityX, "change", (raw) => {
    // 显式归零（松手/拖动结束）直接清滤波值——否则 EMA 单步只衰减一部分，
    // 又没有后续采样继续推进，scale 会卡在略微拉长的状态。
    if (raw === 0) smoothV.current = 0;
    // EMA：new = old + α(raw − old)。
    else smoothV.current += V_SMOOTH * (raw - smoothV.current);
    applyCompression(smoothV.current);
  });

  // box-shadow：单输入 useTransform 会订阅 shadowProgress（由 animate 逐帧更新）。
  const boxShadow = useTransform(shadowProgress, shadowFor);

  // pressed 复位必须挂在 window 上，否则鼠标移出胶囊再松开会卡住。
  useEffect(() => {
    const reset = () => {
      smoothV.current = 0; // 先清滤波值，pressed 变更触发的 applyCompression 才会弹回真形状。
      pressed.set(false);
    };
    window.addEventListener("pointerup", reset);
    window.addEventListener("mouseup", reset);
    window.addEventListener("touchend", reset);
    return () => {
      window.removeEventListener("pointerup", reset);
      window.removeEventListener("mouseup", reset);
      window.removeEventListener("touchend", reset);
    };
  }, [pressed]);

  return { pressed, velocityX, scaleX, scaleY, boxShadow };
}

