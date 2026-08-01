"use client";

import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
} from "motion/react";
import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { useMorphMenu } from "./context";
import {
  anchorShift,
  directionOffset,
  shellAnchorStyle,
} from "./offsets";
import { IOS_POINTER_CANCEL_ATTRACTION_EVENT } from "../ios-pointer";

type ButtonSize = number | { width: number; height: number };

type ContainerProps = {
  children: ReactNode;
  backdrop?: ReactNode;
  buttonSize?: ButtonSize;
  menuWidth?: number;
  menuRadius?: number;
  buttonRadius?: number;
  /** Distance the open panel is offset from the trigger along `direction`. */
  offset?: number;
  className?: string;
  style?: CSSProperties;
};

function resolveButtonSize(buttonSize: ButtonSize) {
  if (typeof buttonSize === "number") {
    return { width: buttonSize, height: buttonSize };
  }
  return buttonSize;
}

export function Container({
  children,
  backdrop,
  buttonSize = 48,
  menuWidth = 200,
  menuRadius = 24,
  buttonRadius,
  offset,
  className = "",
  style,
}: ContainerProps) {
  const {
    open,
    direction,
    anchor,
    visualDuration,
    bounce,
    shellRef,
    contentRef,
    reportMorphSize,
    setMorphing,
    morphing,
    isOpenAnimationCompleteRef,
  } = useMorphMenu();

  const reduced = useReducedMotion();
  const { width: buttonWidth, height: buttonHeight } = resolveButtonSize(buttonSize);
  const closedRadius = buttonRadius ?? Math.min(buttonWidth, buttonHeight) / 2;
  const gap = offset ?? buttonHeight * 0.75;

  // Persist across close — clearing this used to stop/restart the close spring.
  const measuredHeightRef = useRef(buttonHeight);
  const [openTargetHeight, setOpenTargetHeight] = useState<number | null>(null);
  const animGenRef = useRef(0);
  const prevOpenRef = useRef(open);

  // Flip morphing synchronously when `open` changes so Content/Trigger don't
  // unmount for a frame before the spring effect runs (that gap killed glass).
  useLayoutEffect(() => {
    if (prevOpenRef.current === open) return;
    prevOpenRef.current = open;
    setMorphing(true);
    shellRef.current?.dispatchEvent(
      new Event(IOS_POINTER_CANCEL_ATTRACTION_EVENT, { bubbles: true }),
    );
  }, [open, setMorphing, shellRef]);

  useLayoutEffect(() => {
    if (!open) return;
    const el = contentRef.current;
    const next =
      el && el.offsetHeight > 1 ? el.offsetHeight : measuredHeightRef.current;
    measuredHeightRef.current = next;
    setOpenTargetHeight(next);
  }, [open, contentRef]);

  const widthMv = useMotionValue(buttonWidth);
  const heightMv = useMotionValue(buttonHeight);
  const radiusMv = useMotionValue(closedRadius);
  const xMv = useMotionValue(0);
  const yMv = useMotionValue(0);
  const progressMv = useMotionValue(open ? 1 : 0);

  const controlsRef = useRef<AnimationPlaybackControls[]>([]);

  useEffect(() => {
    if (open && openTargetHeight === null) return;

    if (open) {
      isOpenAnimationCompleteRef.current = false;
    }

    const menuHeight = openTargetHeight ?? measuredHeightRef.current;
    const shift = anchorShift(
      direction,
      anchor,
      menuWidth,
      menuHeight,
      buttonWidth,
      buttonHeight,
    );
    const gapXY = directionOffset(direction, gap);
    const openX = gapXY.x + shift.x;
    const openY = gapXY.y + shift.y;

    const spring = reduced
      ? { type: "spring" as const, stiffness: 1000, damping: 100 }
      : { type: "spring" as const, visualDuration, bounce };

    controlsRef.current.forEach((c) => c.stop());
    const animGen = ++animGenRef.current;

    const targetW = open ? menuWidth : buttonWidth;
    const targetH = open ? menuHeight : buttonHeight;
    const targetR = open ? menuRadius : closedRadius;
    const targetX = open ? openX : 0;
    const targetY = open ? openY : 0;

    // Mount / prop churn often re-runs this effect while already at rest.
    // Flipping morphing true then would unmount the trigger and leave an
    // opacity-0 Content layer eating taps until finished resolves — which
    // some mobile WebKits never do for a no-op spring.
    const alreadyAtRest =
      Math.abs(widthMv.get() - targetW) < 0.5 &&
      Math.abs(heightMv.get() - targetH) < 0.5 &&
      Math.abs(radiusMv.get() - targetR) < 0.5 &&
      Math.abs(xMv.get() - targetX) < 0.5 &&
      Math.abs(yMv.get() - targetY) < 0.5;
    if (alreadyAtRest) {
      progressMv.set(open ? 1 : 0);
      setMorphing(false);
      reportMorphSize({
        width: widthMv.get(),
        height: heightMv.get(),
        borderRadius: radiusMv.get(),
      });
      return;
    }

    let cancelled = false;
    let controls: AnimationPlaybackControls[] = [];
    let unsubscribeProgress = () => {};
    const start = async () => {
      if (cancelled || animGen !== animGenRef.current) return;

      setMorphing(true);
      const applyProgress = (progress: number) => {
        const mix = (closed: number, opened: number) =>
          closed + (opened - closed) * progress;
        const width = mix(buttonWidth, menuWidth);
        const height = mix(buttonHeight, menuHeight);
        const radius = mix(closedRadius, menuRadius);
        widthMv.set(width);
        heightMv.set(height);
        radiusMv.set(radius);
        xMv.set(openX * progress);
        yMv.set(openY * progress);
        reportMorphSize({ width, height, borderRadius: radius });
      };
      applyProgress(progressMv.get());
      unsubscribeProgress = progressMv.on("change", applyProgress);
      controls = [animate(progressMv, open ? 1 : 0, spring)];
      controlsRef.current = controls;

      await Promise.all(controls.map((c) => c.finished));
      if (animGen !== animGenRef.current) return;
      setMorphing(false);
      reportMorphSize({
        width: widthMv.get(),
        height: heightMv.get(),
        borderRadius: radiusMv.get(),
      });
    };
    void start();

    return () => {
      cancelled = true;
      unsubscribeProgress();
      controls.forEach((c) => c.stop());
    };
  }, [
    open,
    openTargetHeight,
    menuWidth,
    menuRadius,
    closedRadius,
    buttonWidth,
    buttonHeight,
    direction,
    anchor,
    gap,
    visualDuration,
    bounce,
    reduced,
    widthMv,
    heightMv,
    radiusMv,
    xMv,
    yMv,
    progressMv,
    setMorphing,
    reportMorphSize,
    isOpenAnimationCompleteRef,
  ]);

  const anchorStyle = shellAnchorStyle(direction);

  return (
    <div style={{ position: "relative", width: buttonWidth, height: buttonHeight }}>
      <motion.div
        ref={shellRef}
        data-ios-pointer-attraction-disabled={open || morphing ? "" : undefined}
        className={className}
        style={{
          ...anchorStyle,
          width: widthMv,
          height: heightMv,
          borderRadius: radiusMv,
          x: xMv,
          y: yMv,
          overflow: "hidden",
          cursor: open ? "default" : "pointer",
          // Keep elevated while morphing — dropping to auto the instant `open`
          // flips false lets neighbors cover the shell and kills refraction.
          zIndex: open || morphing ? 50 : "auto",
          willChange: "transform",
          ...style,
        }}
      >
        {backdrop}
        <div
          className="relative size-full"
          style={
            {
              width: open || morphing ? menuWidth : undefined,
              position: open || morphing ? "absolute" : "relative",
              ...(open || morphing
                ? {
                    left:
                      direction === "right"
                        ? 0
                        : direction === "left"
                          ? "auto"
                          : anchor === "start"
                            ? 0
                            : anchor === "center"
                              ? "50%"
                              : "auto",
                    right:
                      direction === "left"
                        ? 0
                        : direction === "right"
                          ? "auto"
                          : anchor === "end"
                            ? 0
                            : "auto",
                    translate:
                      (direction === "top" || direction === "bottom") && anchor === "center"
                        ? "-50% 0"
                        : undefined,
                  }
                : {}),
              "--morph-menu-closed-width": `${buttonWidth}px`,
              "--morph-menu-closed-height": `${buttonHeight}px`,
            } as CSSProperties
          }
        >
          {children}
        </div>
      </motion.div>
    </div>
  );
}
