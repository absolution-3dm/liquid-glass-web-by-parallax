"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LiquidGlass } from "../../registry/liquid-glass/liquid-glass";
import type { GlassMaterialName } from "../../registry/liquid-glass/materials/materials";
import type {
  GlassEngineParams,
  GlassPointerHighlightParams,
} from "../../registry/liquid-glass/refraction/engine";

type CustomizerDraggableGlassProps = {
  borderRadius: number;
  material: {
    preset: GlassMaterialName;
    scale: number;
    blur: number;
    tint: number;
    chroma: number;
    fill: string;
    depth: number;
    curvature: number;
    splay: number;
    glow: number;
    edgeHighlight: number;
    specular: number;
    specularAngle: number;
  };
  engine?: Partial<GlassEngineParams>;
  pointerHighlight?: Partial<GlassPointerHighlightParams> | false;
};

type Point = { x: number; y: number };

const PREVIEW_SCENE = "/images/ChatGPT Image Aug 3, 2026, 08_48_04 PM.png";

function computeGlassShadow(offsetX: number, offsetY: number, lift: number) {
  const depth = 18 + lift * 18;
  const blur = 42 + lift * 32;
  const alpha = 0.38 + lift * 0.24;
  const sx = -offsetX * 0.18;
  const sy = depth - offsetY * 0.16;
  const softAlpha = 0.18 + lift * 0.16;

  return `${sx}px ${sy}px ${blur}px rgb(0 0 0 / ${alpha}), ${sx * 0.45}px ${sy * 0.55 + 10}px ${22 + lift * 18}px rgb(0 0 0 / ${softAlpha})`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

/**
 * Drag via left/top only — never CSS transform. Chromium drops
 * backdrop-filter:url(...) when the surface or an ancestor is transformed.
 *
 * Position + shadow are written straight to the DOM during drag so the
 * shadow tracks the pointer every frame instead of waiting on React renders.
 */
export function CustomizerDraggableGlass({
  borderRadius,
  material,
  engine,
  pointerHighlight,
}: CustomizerDraggableGlassProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const offsetRef = useRef<Point>({ x: 0, y: 0 });
  const liftRef = useRef(0);
  const liftTargetRef = useRef(0);
  const rafRef = useRef(0);
  const sizeRef = useRef({ width: 0, height: 0, previewW: 0, previewH: 0 });

  const [isDragging, setIsDragging] = useState(false);
  const [dragEnabled, setDragEnabled] = useState(true);
  const [positioned, setPositioned] = useState(false);

  const applyPose = (offset: Point, lift: number) => {
    const glass = glassRef.current;
    const { width, height, previewW, previewH } = sizeRef.current;
    if (!glass || width <= 0 || height <= 0 || previewW <= 0 || previewH <= 0) return;

    glass.style.left = `${(previewW - width) / 2 + offset.x}px`;
    glass.style.top = `${(previewH - height) / 2 + offset.y}px`;
    glass.style.boxShadow = computeGlassShadow(offset.x, offset.y, lift);
  };

  const scheduleFrame = () => {
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = 0;
      const nextLift = liftRef.current + (liftTargetRef.current - liftRef.current) * 0.22;
      liftRef.current = Math.abs(nextLift - liftTargetRef.current) < 0.001
        ? liftTargetRef.current
        : nextLift;
      applyPose(offsetRef.current, liftRef.current);
      if (liftRef.current !== liftTargetRef.current) {
        scheduleFrame();
      }
    });
  };

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setDragEnabled(!media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useLayoutEffect(() => {
    const preview = previewRef.current;
    const glass = glassRef.current;
    if (!preview || !glass || typeof ResizeObserver === "undefined") return;

    const sync = () => {
      sizeRef.current = {
        width: glass.offsetWidth,
        height: glass.offsetHeight,
        previewW: preview.clientWidth,
        previewH: preview.clientHeight,
      };
      applyPose(offsetRef.current, liftRef.current);
      setPositioned(true);
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(preview);
    observer.observe(glass);
    return () => observer.disconnect();
  }, [borderRadius]);

  useEffect(() => {
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      const { width, height, previewW, previewH } = sizeRef.current;
      if (!drag || drag.pointerId !== event.pointerId || width <= 0 || height <= 0) return;

      const maxX = Math.max(0, (previewW - width) / 2);
      const maxY = Math.max(0, (previewH - height) / 2);
      offsetRef.current = {
        x: clamp(drag.originX + (event.clientX - drag.startX), -maxX, maxX),
        y: clamp(drag.originY + (event.clientY - drag.startY), -maxY, maxY),
      };
      scheduleFrame();
    };

    const endDrag = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== event.pointerId) return;
      dragRef.current = null;
      liftTargetRef.current = 0;
      setIsDragging(false);
      scheduleFrame();
      try {
        glassRef.current?.releasePointerCapture(event.pointerId);
      } catch {
        // Pointer may already be released.
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", endDrag);
    window.addEventListener("pointercancel", endDrag);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", endDrag);
      window.removeEventListener("pointercancel", endDrag);
    };
  }, [isDragging]);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragEnabled || event.button !== 0) return;
    event.preventDefault();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: offsetRef.current.x,
      originY: offsetRef.current.y,
    };
    liftTargetRef.current = 1;
    setIsDragging(true);
    scheduleFrame();
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  return (
    <div className="customizer-preview" ref={previewRef}>
      <img
        className="customizer-preview__scene"
        src={PREVIEW_SCENE}
        alt=""
        aria-hidden="true"
      />
      <div
        ref={glassRef}
        data-positioned={positioned ? "true" : undefined}
        className={[
          "customizer-preview__glass-wrap",
          isDragging ? "customizer-preview__glass-wrap--dragging" : "",
          dragEnabled ? "" : "customizer-preview__glass-wrap--static",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          boxShadow: computeGlassShadow(0, 0, 0),
          borderRadius,
        }}
        onPointerDown={onPointerDown}
        aria-label="Draggable glass preview"
      >
        <LiquidGlass
          width="100%"
          height={180}
          borderRadius={borderRadius}
          material={material}
          engine={engine}
          pointerHighlight={pointerHighlight}
          className="customizer-preview__glass"
        />
      </div>
      {dragEnabled ? (
        <p
          className={[
            "customizer-preview__hint",
            isDragging ? "customizer-preview__hint--hidden" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          aria-hidden={isDragging}
        >
          Drag to move
        </p>
      ) : null}
    </div>
  );
}
