"use client";

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useMotionValue, useSpring } from "motion/react";
import { MousePointer2 } from "lucide-react";
import {
  LiquidGlass,
  type LiquidGlassProps,
} from "../../registry/liquid-glass/liquid-glass";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../components/ui/carousel";

type MaterialAttributeCardConfig = {
  title: string;
  material: NonNullable<LiquidGlassProps["material"]>;
  engine?: LiquidGlassProps["engine"];
  borderRadius: number;
  pointerHighlight: LiquidGlassProps["pointerHighlight"];
  mockPointer?: boolean;
  pointerHighlightPreview?: LiquidGlassProps["pointerHighlightPreview"];
};

const materialAttributeCards: ReadonlyArray<MaterialAttributeCardConfig> = [
  {
    title: "Pointer Highlight",
    material: { preset: "control", tint: 0.32, fill: "#080808" },
    borderRadius: 64,
    pointerHighlight: {
      radius: 112,
      bloomOpacity: 0.3,
      hoverStrength: 0.78,
      saturation: 1.34,
      brightness: 1.16,
    },
    mockPointer: true,
    pointerHighlightPreview: { x: 0.68, y: 0.25, strength: 0.78 },
  },
  {
    title: "Chromatic Aberration",
    material: { preset: "regular", scale: 1.5, depth: 28, chroma: 1, splay: 0.92, blur: 0, tint: 0.08 },
    engine: { chromaRedBoost: 0.55, chromaGreenBoost: 0.25 },
    borderRadius: 64,
    pointerHighlight: false,
  },
  {
    title: "Edge Highlight",
    material: { preset: "regular", scale: 0.7, edgeHighlight: 2, glow: 0.12, specular: 4 },
    borderRadius: 64,
    pointerHighlight: false,
  },
  {
    title: "Refraction",
    material: { preset: "regular", scale: 1.65, depth: 28, blur: 0.75, tint: 0.08 },
    borderRadius: 64,
    pointerHighlight: false,
  },
  {
    title: "Shape & Depth",
    material: { preset: "regular", scale: 1.9, depth: 40, curvature: 0.65, splay: 0.65, blur: 0, tint: 0.08 },
    borderRadius: 64,
    pointerHighlight: false,
  },
  {
    title: "Blur & Tint",
    material: {
      preset: "panel",
      blur: 1.8,
      tint: 0.3,
      fill: "#15233d",
      edgeHighlight: 1.5,
      glow: 0.08,
      specular: 4,
    },
    borderRadius: 64,
    pointerHighlight: false,
  },
];

function MaterialAttributeCard({ attribute }: { attribute: MaterialAttributeCardConfig }) {
  const initialPreview = attribute.pointerHighlightPreview ?? { x: 0.68, y: 0.25, strength: 0.78 };
  const [preview, setPreview] = useState(initialPreview);
  const [cursorPosition, setCursorPosition] = useState({ x: initialPreview.x, y: initialPreview.y });
  const pointerStrengthRef = useRef(initialPreview.strength ?? 0.78);
  const cursorTargetX = useMotionValue(initialPreview.x);
  const cursorTargetY = useMotionValue(initialPreview.y);
  const cursorX = useSpring(cursorTargetX, { stiffness: 430, damping: 38, mass: 0.65 });
  const cursorY = useSpring(cursorTargetY, { stiffness: 430, damping: 38, mass: 0.65 });

  useEffect(() => {
    if (!attribute.mockPointer) return;
    let frame: number | null = null;

    const syncAnimatedPointer = () => {
      if (frame !== null) return;
      frame = window.requestAnimationFrame(() => {
        frame = null;
        const x = cursorX.get();
        const y = cursorY.get();
        const isOverGlass = x >= 0 && x <= 1 && y >= 0 && y <= 1;
        setCursorPosition({ x, y });
        setPreview({
          x: Math.max(0, Math.min(1, x)),
          y: Math.max(0, Math.min(1, y)),
          strength: isOverGlass ? pointerStrengthRef.current : 0,
        });
      });
    };

    const unsubscribeX = cursorX.on("change", syncAnimatedPointer);
    const unsubscribeY = cursorY.on("change", syncAnimatedPointer);
    return () => {
      unsubscribeX();
      unsubscribeY();
      if (frame !== null) window.cancelAnimationFrame(frame);
    };
  }, [attribute.mockPointer, cursorX, cursorY]);

  const followPointer = (
    event: ReactPointerEvent<HTMLElement>,
    strength = initialPreview.strength ?? 0.78,
  ) => {
    if (!attribute.mockPointer || event.pointerType !== "mouse") return;
    const demo = event.currentTarget.querySelector<HTMLElement>(".attribute-card__pointer-demo");
    if (!demo) return;
    const bounds = demo.getBoundingClientRect();
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    if (pointerStrengthRef.current !== strength) {
      const animatedX = cursorX.get();
      const animatedY = cursorY.get();
      const isOverGlass = animatedX >= 0 && animatedX <= 1 && animatedY >= 0 && animatedY <= 1;
      setPreview({
        x: Math.max(0, Math.min(1, animatedX)),
        y: Math.max(0, Math.min(1, animatedY)),
        strength: isOverGlass ? strength : 0,
      });
    }
    pointerStrengthRef.current = strength;
    cursorTargetX.set(x);
    cursorTargetY.set(y);
  };

  return (
    <article
      className={`attribute-card${attribute.mockPointer ? " attribute-card--pointer-demo" : ""}`}
      data-ios-pointer-suppress={attribute.mockPointer ? "" : undefined}
      onPointerEnter={attribute.mockPointer ? followPointer : undefined}
      onPointerMove={attribute.mockPointer ? followPointer : undefined}
      onPointerDown={attribute.mockPointer ? (event) => followPointer(event, 1) : undefined}
      onPointerUp={attribute.mockPointer ? followPointer : undefined}
      onPointerLeave={
        attribute.mockPointer
          ? () => {
              pointerStrengthRef.current = initialPreview.strength ?? 0.78;
              cursorTargetX.set(initialPreview.x);
              cursorTargetY.set(initialPreview.y);
            }
          : undefined
      }
    >
      <img
        className="showcase-card__scene"
        src="/images/pexels-bento-scene.jpg"
        alt=""
        aria-hidden="true"
      />
      <div className="showcase-card__veil" aria-hidden="true" />
      <div className="attribute-card__copy">
        <h3>{attribute.title}</h3>
      </div>
      <div className="attribute-card__stage">
        {attribute.mockPointer ? (
          <div className="attribute-card__pointer-demo">
            <LiquidGlass
              width="100%"
              height="100%"
              borderRadius={attribute.borderRadius}
              material={attribute.material}
              engine={attribute.engine}
              pointerHighlight={attribute.pointerHighlight}
              pointerHighlightPreview={preview}
              className="attribute-card__glass"
            />
            <MousePointer2
              className="attribute-card__mock-pointer"
              style={{ left: `${cursorPosition.x * 100}%`, top: `${cursorPosition.y * 100}%` }}
              aria-hidden
            />
          </div>
        ) : (
          <LiquidGlass
            width="min(250px, calc(100% - 32px))"
            height={128}
            borderRadius={attribute.borderRadius}
            material={attribute.material}
            engine={attribute.engine}
            pointerHighlight={attribute.pointerHighlight}
            className="attribute-card__glass"
          />
        )}
      </div>
    </article>
  );
}

export function MaterialAttributesCarousel() {
  return (
    <section className="component-section" id="attributes">
      <div className="section-heading">
        <h2>Material Attributes</h2>
        <p>
          Tune the optical field, surface lighting, color separation, and interaction independently.
        </p>
      </div>

      <Carousel
        className="showcase-carousel showcase-carousel--attributes"
        opts={{ align: "start", containScroll: "trimSnaps", dragFree: true }}
        aria-label="Liquid glass material attributes"
      >
        <div className="showcase-carousel__controls">
          <CarouselPrevious className="showcase-carousel__button" />
          <CarouselNext className="showcase-carousel__button" />
        </div>
        <CarouselContent className="showcase-carousel__track">
          {materialAttributeCards.map((attribute) => (
            <CarouselItem className="showcase-carousel__item" key={attribute.title}>
              <MaterialAttributeCard attribute={attribute} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}
