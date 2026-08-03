"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { LiquidGlass } from "../../registry/liquid-glass/liquid-glass";
import type { GlassMaterialName } from "../../registry/liquid-glass/materials/materials";
import type {
  GlassEngineParams,
  GlassPointerHighlightParams,
} from "../../registry/liquid-glass/refraction/engine";
import "../../registry/liquid-glass/compositions/liquid-glass-compositions.css";

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

const PREVIEW_SCENE = "/images/ChatGPT Image Aug 3, 2026, 08_48_04 PM.png";

/**
 * Preview glass uses the same magnetic hover + rubber-band press as CTAs
 * (`data-ios-pointer-target`). Free repositioning is intentionally omitted so
 * snap / drag feel matches the hero Get component / Customize buttons.
 */
export function CustomizerDraggableGlass({
  borderRadius,
  material,
  engine,
  pointerHighlight,
}: CustomizerDraggableGlassProps) {
  const previewRef = useRef<HTMLDivElement>(null);
  const glassRef = useRef<HTMLDivElement>(null);
  const [positioned, setPositioned] = useState(false);

  useLayoutEffect(() => {
    const preview = previewRef.current;
    const glass = glassRef.current;
    if (!preview || !glass || typeof ResizeObserver === "undefined") return;

    const sync = () => {
      const width = glass.offsetWidth;
      const height = glass.offsetHeight;
      const previewW = preview.clientWidth;
      const previewH = preview.clientHeight;
      if (width <= 0 || height <= 0 || previewW <= 0 || previewH <= 0) return;
      glass.style.left = `${(previewW - width) / 2}px`;
      glass.style.top = `${(previewH - height) / 2}px`;
      setPositioned(true);
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(preview);
    observer.observe(glass);
    return () => observer.disconnect();
  }, [borderRadius]);

  return (
    <div className="customizer-preview" ref={previewRef}>
      <img
        className="customizer-preview__scene"
        src={PREVIEW_SCENE}
        alt=""
        aria-hidden="true"
        draggable={false}
      />
      <div
        ref={glassRef}
        data-positioned={positioned ? "true" : undefined}
        data-ios-pointer-target=""
        className="customizer-preview__glass-wrap"
        style={{ borderRadius }}
        aria-label="Glass preview"
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
    </div>
  );
}
