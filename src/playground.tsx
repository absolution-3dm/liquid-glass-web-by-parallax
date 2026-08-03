"use client";

import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Copy01Icon,
  FileCodeIcon,
  Home01Icon,
  Menu01Icon,
  Search01Icon,
  Settings01Icon,
  Tick01Icon,
} from "@hugeicons/core-free-icons";
import {
  LiquidGlass,
  type LiquidGlassProps,
} from "../registry/liquid-glass/liquid-glass";
import {
  resolveGlassMaterial,
  type GlassMaterialName,
} from "../registry/liquid-glass/materials/materials";
import { GlassSegmentedControl } from "../registry/liquid-glass/compositions/glass-segmented-control";
import { GlassShellBackdrop } from "../registry/liquid-glass/compositions/glass-shell-backdrop";
import { GlassIconPill } from "../registry/liquid-glass/compositions/glass-icon-pill";
import { IOSPointer } from "../registry/liquid-glass/compositions/ios-pointer";
import {
  MorphMenuHoverFill,
  useMorphMenuHover,
} from "../registry/liquid-glass/compositions/morph-menu-hover";
import { MorphMenu } from "../registry/liquid-glass/compositions/morph-menu";
import { GlassSlider } from "./components/glass-slider";
import { CustomizeColorField } from "./components/customize-color-field";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./components/ui/carousel";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./components/ui/tabs";
import {
  advancedMaterialParamDefs,
  diffPartial,
  engineParamDefs,
  formatJsxObject,
  pointerParamDefs,
  type EngineState,
  type PointerState,
} from "./customizer-params";
import {
  glassEngineSnapshot,
  glassPointerHighlightSnapshot,
} from "../registry/liquid-glass/refraction/engine";

const segmentItems = [
  { value: "overview", label: "Overview" },
  { value: "motion", label: "Motion" },
  { value: "optics", label: "Optics" },
];

const menuItems = ["Overview", "Components", "Installation", "Documentation"];

const topNavigationItems = [
  { value: "menu", label: "Home", href: "#menu" },
  { value: "attributes", label: "Attributes", href: "#attributes" },
  { value: "components", label: "Pre-built", href: "#components" },
  { value: "customize", label: "Customize", href: "#customize" },
  { value: "installation", label: "Install", href: "#installation" },
];

const customizerPresets = ["regular", "navigation", "control", "panel"] as const;
type CustomizerPreset = (typeof customizerPresets)[number];

/** Hero Install CTA — cooler blue glass pill. */
const heroCtaMaterial = {
  preset: "control" as const,
  fill: "#0b2f6b",
  tint: 0.82,
  blur: 1.25,
  specular: 3,
  chroma: 0.08,
};

/** Hero stack — near-black fill so stacked panes don't wash out milky. */
const heroStackMaterial = {
  preset: "navigation" as const,
  scale: 0.7,
  splay: 1,
  blur: 2,
  tint: 0.15,
  depth: 30,
  fill: "#000000",
};

/** Keep stacked hero panes from compounding backdrop saturate into neon. */
const heroStackEngine = {
  backdropSaturateSvg: 1.1,
  backdropSaturateCssBlur: 1.08,
};

/** Staggered hero capsule stack — front-left to back-right. */
const HERO_CAPSULE_COUNT = 5;

const usageExample = `import { LiquidGlass } from "@/components/liquid-glass/liquid-glass"

<LiquidGlass width={320} height={96} borderRadius={32} material="panel">
  Your content
</LiquidGlass>`;

const registryPackages = [
  {
    name: "liquid-glass",
    title: "LiquidGlass",
    description: "Primitive · Chromium refraction",
    file: "liquid-glass.json",
  },
  {
    name: "liquid-glass-capsule",
    title: "Capsule",
    description: "Composition · Motion drag",
    file: "liquid-glass-capsule.json",
  },
  {
    name: "liquid-glass-menu",
    title: "Morph Menu",
    description: "Composition · Motion morph",
    file: "liquid-glass-menu.json",
  },
  {
    name: "liquid-glass-navigation",
    title: "Navigation",
    description: "Composition · Motion snap",
    file: "liquid-glass-navigation.json",
  },
  {
    name: "liquid-glass-icon-pill",
    title: "Icon Pill",
    description: "Composition · Motion-free",
    file: "liquid-glass-icon-pill.json",
  },
  {
    name: "liquid-glass-magnetic-pointer",
    title: "Magnetic Pointer",
    description: "Composition · Custom spring",
    file: "liquid-glass-magnetic-pointer.json",
  },
] as const;

const showcaseIconPills = [
  { icon: Home01Icon, label: "Home" },
  { icon: Search01Icon, label: "Search" },
  { icon: Settings01Icon, label: "Settings" },
] as const;

const materialAttributeCards = [
  {
    title: "Refraction",
    description: "Bend the scene behind the surface to control the strength and physical depth of the lens.",
    material: { preset: "regular", scale: 1.65, depth: 28, blur: 0.75, tint: 0.08 },
    borderRadius: 36,
    pointerHighlight: false,
  },
  {
    title: "Edge Highlight",
    description: "Shape the bright rim and directional sheen that make the glass edge readable.",
    material: { preset: "regular", scale: 0.7, edgeHighlight: 2, glow: 0.12, specular: 4 },
    borderRadius: 36,
    pointerHighlight: false,
  },
  {
    title: "Chromatic Aberration",
    description: "Split color channels around refracted edges for a subtle optical spectrum.",
    material: { preset: "regular", scale: 1.15, chroma: 0.8, splay: 0.92, blur: 0.7 },
    borderRadius: 36,
    pointerHighlight: false,
  },
  {
    title: "Pointer Highlight",
    description: "Add a responsive bloom that follows the pointer and intensifies while pressing.",
    material: { preset: "control", tint: 0.32, fill: "#080808" },
    borderRadius: 36,
    pointerHighlight: undefined,
  },
  {
    title: "Blur & Tint",
    description: "Separate content from a busy backdrop with adjustable softness, opacity, and color.",
    material: { preset: "panel", blur: 5, tint: 0.7, fill: "#15233d" },
    borderRadius: 36,
    pointerHighlight: false,
  },
  {
    title: "Shape & Depth",
    description: "Tune how the optical field rolls from the center into corners and rounded edges.",
    material: { preset: "regular", scale: 1.2, depth: 36, curvature: 0.45, splay: 0.6 },
    borderRadius: 64,
    pointerHighlight: false,
  },
] satisfies ReadonlyArray<{
  title: string;
  description: string;
  material: NonNullable<LiquidGlassProps["material"]>;
  borderRadius: number;
  pointerHighlight: LiquidGlassProps["pointerHighlight"];
}>;

function useClipboard(text: string) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return { copied, copy };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function highlightCode(code: string, language: "bash" | "tsx") {
  const slots: string[] = [];
  const park = (html: string) => {
    const marker = `\u0000${"x".repeat(slots.length + 1)}\u0000`;
    slots.push(html);
    return marker;
  };
  const wrap = (tokenClass: string, value: string) =>
    park(`<span class="${tokenClass}">${escapeHtml(value)}</span>`);

  let text = code;

  if (language === "bash") {
    text = text.replace(/(https?:\/\/\S+)/g, (match) => wrap("token-string", match));
    text = text.replace(
      /\b(pnpm|npm|npx|yarn|bun|dlx|shadcn@latest|add)\b/g,
      (match) => wrap("token-keyword", match),
    );
  } else {
    text = text.replace(/("[^"\n]*"|'[^'\n]*')/g, (match) => wrap("token-string", match));
    text = text.replace(
      /\b(import|from|export|const|return)\b/g,
      (match) => wrap("token-keyword", match),
    );
    text = text.replace(/(<\/?[A-Za-z][\w.]*)/g, (match) => wrap("token-tag", match));
    text = text.replace(/\b(\d+(?:\.\d+)?)\b/g, (match) => wrap("token-number", match));
  }

  return escapeHtml(text).replace(/\u0000(x+)\u0000/g, (_, marker: string) => {
    return slots[marker.length - 1] ?? "";
  });
}

/** Axonometric resting pose — negative X tilts as if looking down from above. */
const HERO_AXON_ROTATE_X = -22;
const HERO_AXON_ROTATE_Y = -28;

/** Idle float: small vertical wave, staggered across the stack. */
const HERO_FLOAT_AMPLITUDE_PX = 5;
const HERO_FLOAT_PERIOD_SEC = 5.6;
const HERO_FLOAT_PHASE_STEP = 0.9;
const HERO_FLOAT_FPS = 12;

/** Pointer pull: shorter travel with a tighter falloff around the hovered pane. */
const HERO_PULL_DISTANCE_RATIO = 0.14;
const HERO_PULL_SIGMA_RATIO = 0.62;

/** Panel aspect used when fitting the stack into the orbit stage. */
const HERO_PANEL_ASPECT = 212 / 188;

/**
 * Pick panel metrics so the axonometric stack fills most of the stage.
 * Sizes step by 8px to avoid thrashing LiquidGlass lens regeneration while resizing.
 */
function resolveHeroPanelMetrics(stageWidth: number, stageHeight: number) {
  const safeW = Math.max(0, stageWidth);
  const safeH = Math.max(0, stageHeight);
  // Fill most of the stage; leave a little room for the projected Z-stack margins.
  const widthByStage = Math.min(safeW * 0.7, safeH * 0.7 * (1 / HERO_PANEL_ASPECT));
  const width = Math.round(
    Math.min(360, Math.max(200, widthByStage)) / 8,
  ) * 8;
  const height = Math.round((width * HERO_PANEL_ASPECT) / 8) * 8;
  const radius = Math.round(Math.min(80, Math.max(48, width * 0.255)));
  const depthStep = Math.round(Math.min(136, Math.max(80, width * 0.42)));
  return { width, height, radius, depthStep };
}

const HERO_PANEL_FALLBACK = resolveHeroPanelMetrics(560, 640);

/**
 * Project a pure-Z offset through rotateY then rotateX. Panels stay
 * XY-aligned in model space; screen stagger comes only from this projection.
 *
 * Each panel applies the same rotateX/Y itself (transform-style: flat) instead
 * of sitting under a preserve-3d stage — that keeps the axonometric face tilt
 * while avoiding the WebKit bug where a rotating 3D ancestor drops
 * backdrop-filter on some panes.
 */
function projectAxonZ(z: number, rotateXDeg: number, rotateYDeg: number) {
  const alpha = (rotateXDeg * Math.PI) / 180;
  const beta = (rotateYDeg * Math.PI) / 180;
  return {
    x: z * Math.sin(beta),
    y: -z * Math.cos(beta) * Math.sin(alpha),
  };
}

/** Soft X-proximity (0..1) from pointer to a panel's resting screen X. */
function heroPullProximity(pointerX: number, restX: number, sigma: number) {
  if (sigma <= 0) return 0;
  const t = (pointerX - restX) / sigma;
  return Math.exp(-0.5 * t * t);
}

function HeroStackPanel({
  index,
  width,
  height,
  radius,
  depthStep,
  pullPointerX,
  floatClock,
}: {
  index: number;
  width: number;
  height: number;
  radius: number;
  depthStep: number;
  pullPointerX: MotionValue<number>;
  floatClock: MotionValue<number>;
}) {
  // Center the Z stack on 0 so the projected stack stays visually centered.
  const z = ((HERO_CAPSULE_COUNT - 1) / 2 - index) * depthStep;
  const rest = projectAxonZ(z, HERO_AXON_ROTATE_X, HERO_AXON_ROTATE_Y);
  // Spacing between neighboring rest X positions ≈ |sin(β)| * depthStep.
  const sigma = Math.max(
    28,
    Math.abs(projectAxonZ(depthStep, HERO_AXON_ROTATE_X, HERO_AXON_ROTATE_Y).x) *
      HERO_PULL_SIGMA_RATIO,
  );
  const pullDistance = height * HERO_PULL_DISTANCE_RATIO;
  // Keep stacking order fixed — pulling must not reshuffle paint order.
  const zIndex = HERO_CAPSULE_COUNT - index;
  const floatPhase = index * HERO_FLOAT_PHASE_STEP;

  const pull = useSpring(0, { stiffness: 280, damping: 28, mass: 0.55 });

  useEffect(() => {
    const unsub = pullPointerX.on("change", (px) => {
      pull.set(heroPullProximity(Number(px), rest.x, sigma));
    });
    pull.set(heroPullProximity(pullPointerX.get(), rest.x, sigma));
    return unsub;
  }, [pullPointerX, pull, rest.x, sigma]);

  const y = useTransform([pull, floatClock], ([p, t]) => {
    const wave =
      Math.sin((Number(t) / HERO_FLOAT_PERIOD_SEC) * Math.PI * 2 + floatPhase) *
      HERO_FLOAT_AMPLITUDE_PX;
    return rest.y + wave - Number(p) * pullDistance;
  });

  return (
    <motion.div
      className="hero-orbit__capsule"
      style={{
        width,
        height,
        zIndex,
        x: rest.x,
        y,
        rotateX: HERO_AXON_ROTATE_X,
        rotateY: HERO_AXON_ROTATE_Y,
        // Large perspective ≈ orthographic axonometric foreshortening.
        transformPerspective: 12000,
        transformOrigin: "50% 50%",
      }}
    >
      <LiquidGlass
        width={width}
        height={height}
        borderRadius={radius}
        material={heroStackMaterial}
        engine={heroStackEngine}
        pointerHighlight={false}
        className="hero-orbit__capsule-glass"
      />
    </motion.div>
  );
}

function HeroFloatStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const clusterRef = useRef<HTMLDivElement>(null);
  const [metrics, setMetrics] = useState(HERO_PANEL_FALLBACK);
  const reduceMotionRef = useRef(false);

  // Pull uses cluster-local X. Far value collapses all pulls.
  const pullPointerX = useMotionValue(10_000);
  const floatClock = useMotionValue(0);

  useEffect(() => {
    const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncReduce = () => {
      reduceMotionRef.current = reduceMq.matches;
      if (reduceMq.matches) {
        pullPointerX.set(10_000);
        floatClock.set(0);
      }
    };
    syncReduce();
    reduceMq.addEventListener("change", syncReduce);
    return () => {
      reduceMq.removeEventListener("change", syncReduce);
    };
  }, [pullPointerX, floatClock]);

  useEffect(() => {
    if (reduceMotionRef.current) return;
    let frame = 0;
    const started = performance.now();
    let lastUpdate = started;
    const frameInterval = 1000 / HERO_FLOAT_FPS;
    const tick = (now: number) => {
      const elapsed = now - lastUpdate;
      if (!reduceMotionRef.current && elapsed >= frameInterval) {
        lastUpdate = now - (elapsed % frameInterval);
        floatClock.set((now - started) / 1000);
      }
      frame = window.requestAnimationFrame(tick);
    };
    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [floatClock]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || typeof ResizeObserver === "undefined") return;

    const sync = () => {
      const rect = stage.getBoundingClientRect();
      const next = resolveHeroPanelMetrics(rect.width, rect.height);
      setMetrics((prev) =>
        prev.width === next.width &&
        prev.height === next.height &&
        prev.radius === next.radius &&
        prev.depthStep === next.depthStep
          ? prev
          : next,
      );
    };

    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(stage);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    const hero = stage?.closest(".hero");
    if (!stage || !(hero instanceof HTMLElement)) return;

    const onPointerMove = (event: PointerEvent) => {
      if (reduceMotionRef.current) return;
      const cluster = clusterRef.current;
      if (!cluster) return;
      const clusterRect = cluster.getBoundingClientRect();
      if (clusterRect.width <= 0) return;
      pullPointerX.set(event.clientX - (clusterRect.left + clusterRect.width / 2));
    };

    const onPointerLeave = () => {
      pullPointerX.set(10_000);
    };

    hero.addEventListener("pointermove", onPointerMove);
    hero.addEventListener("pointerleave", onPointerLeave);
    return () => {
      hero.removeEventListener("pointermove", onPointerMove);
      hero.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [pullPointerX]);

  const { width, height, radius, depthStep } = metrics;

  return (
    <div className="hero-orbit" ref={stageRef} aria-label="LiquidGlass panel stack">
      <div className="hero-orbit__stage">
        <div className="hero-orbit__cluster" ref={clusterRef} style={{ width, height }}>
          {Array.from({ length: HERO_CAPSULE_COUNT }, (_, index) => (
            <HeroStackPanel
              key={index}
              index={index}
              width={width}
              height={height}
              radius={radius}
              depthStep={depthStep}
              pullPointerX={pullPointerX}
              floatClock={floatClock}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ShowcaseMorphMenu({
  defaultOpen = false,
}: {
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { clearHoveredItem, hoveredItem, syncHoveredItem } = useMorphMenuHover();

  return (
    <div>
      <MorphMenu.Root
        open={open}
        onOpenChange={(next) => {
          clearHoveredItem();
          setOpen(next);
        }}
        direction="bottom"
        anchor="start"
        visualDuration={0.28}
        bounce={0}
        closeOnClickOutside={!defaultOpen}
      >
        <MorphMenu.Container
          buttonSize={48}
          menuWidth={248}
          menuRadius={28}
          buttonRadius={24}
          offset={12}
          className="component-menu__shell"
          backdrop={<GlassShellBackdrop borderRadius={28} material="navigation" />}
        >
          <MorphMenu.Trigger
            aria-label={open ? "Close menu" : "Open menu"}
            className="navigation-menu__trigger"
          >
            <HugeiconsIcon
              icon={Menu01Icon}
              altIcon={Cancel01Icon}
              showAlt={open}
              size={20}
              color="currentColor"
              strokeWidth={1.75}
              aria-hidden
            />
          </MorphMenu.Trigger>

          <MorphMenu.Content
            className="navigation-menu__content"
            onPointerLeave={clearHoveredItem}
          >
            <div className="navigation-menu__heading">
              <span>Menu</span>
            </div>
            <div className="navigation-menu__items">
              <MorphMenuHoverFill hoveredItem={hoveredItem} />
              {menuItems.map((item) => (
                <MorphMenu.Item
                  key={item}
                  className="navigation-menu__item"
                  onPointerEnter={syncHoveredItem}
                >
                  <span>{item}</span>
                </MorphMenu.Item>
              ))}
            </div>
          </MorphMenu.Content>
        </MorphMenu.Container>
      </MorphMenu.Root>
    </div>
  );
}

function MaterialAttributesCarousel() {
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
              <article className="attribute-card">
                <img
                  className="showcase-card__scene"
                  src="/images/pexels-bento-scene.jpg"
                  alt=""
                  aria-hidden="true"
                />
                <div className="showcase-card__veil" aria-hidden="true" />
                <div className="attribute-card__copy">
                  <h3>{attribute.title}</h3>
                  <p>{attribute.description}</p>
                </div>
                <div className="attribute-card__stage">
                  <LiquidGlass
                    width="min(250px, calc(100% - 32px))"
                    height={128}
                    borderRadius={attribute.borderRadius}
                    material={attribute.material}
                    pointerHighlight={attribute.pointerHighlight}
                    className="attribute-card__glass"
                  >
                    <span>{attribute.title}</span>
                  </LiquidGlass>
                </div>
              </article>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}

function PrebuiltComponentsCarousel() {
  const [segmentValue, setSegmentValue] = useState("motion");

  return (
    <section className="component-section" id="components">
      <div className="section-heading">
        <h2>Pre-built Components</h2>
        <p>
          Source-owned compositions ready to install, adapt, and ship with the primitive.
        </p>
      </div>

      <Carousel
        className="showcase-carousel showcase-carousel--components"
        opts={{ align: "start", containScroll: "trimSnaps", dragFree: true }}
        aria-label="Pre-built liquid glass components"
      >
        <div className="showcase-carousel__controls">
          <CarouselPrevious className="showcase-carousel__button" />
          <CarouselNext className="showcase-carousel__button" />
        </div>
        <CarouselContent className="showcase-carousel__track">
          <CarouselItem className="showcase-carousel__item showcase-carousel__item--component">
            <article className="component-card">
              <img className="showcase-card__scene" src="/images/pexels-bento-scene.jpg" alt="" aria-hidden="true" />
              <div className="showcase-card__veil" aria-hidden="true" />
              <span className="component-card__label">Morph Menu</span>
              <div className="component-card__stage component-card__menu-states">
                <div className="component-card__state component-card__state--expanded-menu">
                  <span>Expanded</span>
                  <div className="component-card__menu-preview component-card__menu-preview--expanded">
                    <ShowcaseMorphMenu defaultOpen />
                  </div>
                </div>
                <div className="component-card__state component-card__state--collapsed-menu">
                  <span>Collapsed</span>
                  <div className="component-card__menu-preview component-card__menu-preview--collapsed">
                    <ShowcaseMorphMenu />
                  </div>
                </div>
              </div>
            </article>
          </CarouselItem>

          <CarouselItem className="showcase-carousel__item showcase-carousel__item--component">
            <article className="component-card">
              <img className="showcase-card__scene" src="/images/pexels-bento-scene.jpg" alt="" aria-hidden="true" />
              <div className="showcase-card__veil" aria-hidden="true" />
              <span className="component-card__label">Segmented Control</span>
              <div className="component-card__stage component-card__stage--center">
                <div className="component-card__segment-states">
                  <div className="component-card__state component-card__state--segment component-card__state--resting">
                    <span>Resting</span>
                    <GlassSegmentedControl
                      items={segmentItems}
                      value={segmentValue}
                      onValueChange={setSegmentValue}
                      itemWidth={80}
                      itemHeight={40}
                      padding={4}
                      radialExpansion={0}
                      material="navigation"
                      pressedMaterial="selectionPressed"
                      itemClassName="segment-item"
                    />
                  </div>
                  <div className="component-card__state component-card__state--segment">
                    <span>Pressed</span>
                    <GlassSegmentedControl
                      items={segmentItems}
                      value={segmentValue}
                      onValueChange={setSegmentValue}
                      itemWidth={80}
                      itemHeight={40}
                      padding={4}
                      radialExpansion={8}
                      material="navigation"
                      pressedMaterial="selectionPressed"
                      pressedPreview
                      itemClassName="segment-item"
                    />
                  </div>
                </div>
              </div>
            </article>
          </CarouselItem>

          <CarouselItem className="showcase-carousel__item showcase-carousel__item--component">
            <article className="component-card">
              <img className="showcase-card__scene" src="/images/pexels-bento-scene.jpg" alt="" aria-hidden="true" />
              <div className="showcase-card__veil" aria-hidden="true" />
              <span className="component-card__label">Icon Pills</span>
              <div className="component-card__stage component-card__stage--center component-card__icons">
                {showcaseIconPills.map(({ icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    className="component-card__icon-button"
                    data-ios-pointer-target=""
                    aria-label={label}
                  >
                    <GlassIconPill size={48} material="navigation">
                      <HugeiconsIcon
                        icon={icon}
                        size={20}
                        color="currentColor"
                        strokeWidth={1.75}
                        className="component-card__icon"
                        aria-hidden
                      />
                    </GlassIconPill>
                  </button>
                ))}
              </div>
            </article>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
    </section>
  );
}

function CodeBlock({
  label,
  code,
  language = "tsx",
}: {
  label: string;
  code: string;
  language?: "bash" | "tsx";
}) {
  const { copied, copy } = useClipboard(code);

  return (
    <div className="code-block">
      <div className="code-block__header">
        <div className="code-block__meta">
          <span className="code-block__label">{label}</span>
          <span className="code-block__language">{language}</span>
        </div>
        <button
          type="button"
          className={`code-block__copy${copied ? " is-copied" : ""}`}
          onClick={() => void copy()}
          aria-label={copied ? "Copied" : `Copy ${label}`}
        >
          <HugeiconsIcon
            icon={copied ? Tick01Icon : Copy01Icon}
            size={14}
            color="currentColor"
            strokeWidth={1.75}
            aria-hidden
          />
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <pre>
        <code
          dangerouslySetInnerHTML={{ __html: highlightCode(code, language) }}
        />
      </pre>
    </div>
  );
}

function RegistryAttachment({
  title,
  description,
  file,
  command,
}: {
  title: string;
  description: string;
  file: string;
  command: string;
}) {
  const { copied, copy } = useClipboard(command);

  return (
    <div className="attachment">
      <div className="attachment__media" aria-hidden>
        <HugeiconsIcon
          icon={FileCodeIcon}
          size={18}
          color="currentColor"
          strokeWidth={1.6}
          aria-hidden
        />
      </div>
      <div className="attachment__content">
        <div className="attachment__title">{title}</div>
        <div className="attachment__description">
          {file} · {description}
        </div>
      </div>
      <div className="attachment__actions">
        <button
          type="button"
          className={`attachment__action${copied ? " is-copied" : ""}`}
          onClick={() => void copy()}
          aria-label={copied ? `Copied ${title}` : `Copy install command for ${title}`}
        >
          <HugeiconsIcon
            icon={copied ? Tick01Icon : Copy01Icon}
            size={14}
            color="currentColor"
            strokeWidth={1.75}
            aria-hidden
          />
        </button>
      </div>
    </div>
  );
}

function CustomizeShowcase() {
  const engineDefaults = useMemo(() => glassEngineSnapshot(), []);
  const pointerDefaults = useMemo(() => glassPointerHighlightSnapshot(), []);
  const initialMaterial = resolveGlassMaterial("regular");

  const [preset, setPreset] = useState<CustomizerPreset>("regular");
  const [scale, setScale] = useState(initialMaterial.scale);
  const [blur, setBlur] = useState(initialMaterial.blur);
  const [tint, setTint] = useState(initialMaterial.tint);
  const [chroma, setChroma] = useState(initialMaterial.chroma);
  const [fill, setFill] = useState(initialMaterial.fill);
  const [borderRadius, setBorderRadius] = useState(36);
  const [depth, setDepth] = useState(initialMaterial.depth);
  const [curvature, setCurvature] = useState(initialMaterial.curvature);
  const [splay, setSplay] = useState(initialMaterial.splay);
  const [glow, setGlow] = useState(initialMaterial.glow);
  const [edgeHighlight, setEdgeHighlight] = useState(initialMaterial.edgeHighlight);
  const [specular, setSpecular] = useState(initialMaterial.specular);
  const [specularAngle, setSpecularAngle] = useState(initialMaterial.specularAngle);
  const [engine, setEngine] = useState<EngineState>(engineDefaults);
  const [pointerHighlightEnabled, setPointerHighlightEnabled] = useState(true);
  const [pointerHighlight, setPointerHighlight] = useState<PointerState>(pointerDefaults);

  const applyMaterialPreset = (material: ReturnType<typeof resolveGlassMaterial>) => {
    setScale(material.scale);
    setBlur(material.blur);
    setTint(material.tint);
    setChroma(material.chroma);
    setFill(material.fill);
    setDepth(material.depth);
    setCurvature(material.curvature);
    setSplay(material.splay);
    setGlow(material.glow);
    setEdgeHighlight(material.edgeHighlight);
    setSpecular(material.specular);
    setSpecularAngle(material.specularAngle);
  };

  const selectPreset = (next: CustomizerPreset) => {
    setPreset(next);
    applyMaterialPreset(resolveGlassMaterial(next));
  };

  const material = {
    preset,
    scale,
    blur,
    tint,
    chroma,
    fill,
    depth,
    curvature,
    splay,
    glow,
    edgeHighlight,
    specular,
    specularAngle,
  } satisfies {
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

  const engineOverrides = useMemo(
    () => diffPartial(engine, engineDefaults),
    [engine, engineDefaults],
  );
  const pointerHighlightProp = useMemo(() => {
    if (!pointerHighlightEnabled) return false as const;
    const overrides = diffPartial(pointerHighlight, pointerDefaults);
    return Object.keys(overrides).length > 0 ? overrides : undefined;
  }, [pointerHighlight, pointerDefaults, pointerHighlightEnabled]);

  const advancedMaterialValues = {
    depth,
    curvature,
    splay,
    glow,
    edgeHighlight,
    specular,
    specularAngle,
  };

  const setAdvancedMaterialValue = (key: keyof typeof advancedMaterialValues, value: number) => {
    switch (key) {
      case "depth":
        setDepth(value);
        break;
      case "curvature":
        setCurvature(value);
        break;
      case "splay":
        setSplay(value);
        break;
      case "glow":
        setGlow(value);
        break;
      case "edgeHighlight":
        setEdgeHighlight(value);
        break;
      case "specular":
        setSpecular(value);
        break;
      case "specularAngle":
        setSpecularAngle(value);
        break;
    }
  };

  const setEngineValue = (key: keyof EngineState, value: number) => {
    setEngine((current) => ({ ...current, [key]: value }));
  };

  const setPointerValue = (key: keyof PointerState, value: number) => {
    setPointerHighlight((current) => ({ ...current, [key]: value }));
  };

  const generatedExample = useMemo(() => {
    const props = [
      "width={340}",
      "height={180}",
      `borderRadius={${borderRadius}}`,
      `material={${formatJsxObject(
        {
          preset,
          scale,
          blur,
          tint,
          chroma,
          fill,
          depth,
          curvature,
          splay,
          glow,
          edgeHighlight,
          specular,
          specularAngle,
        },
        "    ",
      )}}`,
    ];

    if (Object.keys(engineOverrides).length > 0) {
      props.push(`engine={${formatJsxObject(engineOverrides as Record<string, number>, "  ")}}`);
    }

    if (pointerHighlightProp === false) {
      props.push("pointerHighlight={false}");
    } else if (pointerHighlightProp) {
      props.push(
        `pointerHighlight={${formatJsxObject(pointerHighlightProp as Record<string, number>, "  ")}}`,
      );
    }

    return `<LiquidGlass\n  ${props.join("\n  ")}\n/>`;
  }, [
    preset,
    scale,
    blur,
    tint,
    chroma,
    fill,
    depth,
    curvature,
    splay,
    glow,
    edgeHighlight,
    specular,
    specularAngle,
    borderRadius,
    engineOverrides,
    pointerHighlightProp,
  ]);

  return (
    <section className="component-section" id="customize">
      <div className="section-heading">
        <h2>Customize</h2>
        <p>Start from a preset, then tune material, engine, and pointer-highlight overrides for this preview only.</p>
      </div>

      <div className="customizer-layout">
        <div className="customizer-preview">
          <img
            className="customizer-preview__scene"
            src="/images/pexels-bento-scene.jpg"
            alt=""
            aria-hidden="true"
          />
          <LiquidGlass
            width="min(340px, calc(100% - 32px))"
            height={180}
            borderRadius={borderRadius}
            material={material}
            engine={Object.keys(engineOverrides).length > 0 ? engineOverrides : undefined}
            pointerHighlight={pointerHighlightProp}
            className="customizer-preview__glass"
          >
            <div className="customizer-preview__content">
              <strong>{preset}</strong>
            </div>
          </LiquidGlass>
        </div>

        <div className="customizer-controls">
          <Tabs className="customizer-tabs" defaultValue="controls">
            <TabsList className="customizer-tabs__list" aria-label="Customize panel view">
              <TabsTrigger className="customizer-tabs__trigger" value="controls">
                Controls
              </TabsTrigger>
              <TabsTrigger className="customizer-tabs__trigger" value="jsx">
                JSX
              </TabsTrigger>
            </TabsList>

            <TabsContent className="customizer-tabs__content" value="controls">
              <label className="customizer-select">
                <span>Preset</span>
                <select
                  value={preset}
                  onChange={(event) =>
                    selectPreset(event.currentTarget.value as CustomizerPreset)
                  }
                >
                  {customizerPresets.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>

              <details className="customizer-section" open>
                <summary className="customizer-section__summary">Material</summary>
                <div className="customizer-sliders">
                  <GlassSlider label="Scale" value={scale} min={0} max={3} step={0.01} onChange={setScale} />
                  <GlassSlider label="Blur" value={blur} min={0} max={8} step={0.1} display={`${blur.toFixed(1)} px`} onChange={setBlur} />
                  <GlassSlider label="Tint" value={tint} min={0} max={1} step={0.01} onChange={setTint} />
                  <GlassSlider label="Chroma" value={chroma} min={0} max={1} step={0.01} onChange={setChroma} />
                  <GlassSlider label="Radius" value={borderRadius} min={12} max={90} step={1} display={`${borderRadius} px`} onChange={setBorderRadius} />
                </div>
              </details>

              <details className="customizer-section">
                <summary className="customizer-section__summary">Advanced Material</summary>
                <div className="customizer-sliders">
                  {advancedMaterialParamDefs.map((param) => (
                    <GlassSlider
                      key={param.key}
                      label={param.label}
                      value={advancedMaterialValues[param.key as keyof typeof advancedMaterialValues]}
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      display={param.format?.(advancedMaterialValues[param.key as keyof typeof advancedMaterialValues])}
                      onChange={(value) =>
                        setAdvancedMaterialValue(param.key as keyof typeof advancedMaterialValues, value)
                      }
                    />
                  ))}
                </div>
              </details>

              <details className="customizer-section">
                <summary className="customizer-section__summary">Engine</summary>
                <div className="customizer-sliders">
                  {engineParamDefs.map((param) => (
                    <GlassSlider
                      key={param.key}
                      label={param.label}
                      value={engine[param.key as keyof EngineState]}
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      display={param.format?.(engine[param.key as keyof EngineState])}
                      onChange={(value) => setEngineValue(param.key as keyof EngineState, value)}
                    />
                  ))}
                </div>
              </details>

              <details className="customizer-section">
                <summary className="customizer-section__summary">Pointer Highlight</summary>
                <label className="customizer-toggle">
                  <span>Enabled</span>
                  <input
                    type="checkbox"
                    checked={pointerHighlightEnabled}
                    onChange={(event) => setPointerHighlightEnabled(event.currentTarget.checked)}
                  />
                </label>
                <div className={`customizer-sliders${pointerHighlightEnabled ? "" : " customizer-sliders--disabled"}`}>
                  {pointerParamDefs.map((param) => (
                    <GlassSlider
                      key={param.key}
                      label={param.label}
                      value={pointerHighlight[param.key as keyof PointerState]}
                      min={param.min}
                      max={param.max}
                      step={param.step}
                      display={param.format?.(pointerHighlight[param.key as keyof PointerState])}
                      disabled={!pointerHighlightEnabled}
                      onChange={(value) => setPointerValue(param.key as keyof PointerState, value)}
                    />
                  ))}
                </div>
              </details>

              <CustomizeColorField label="Fill" value={fill} onChange={setFill} />
            </TabsContent>

            <TabsContent className="customizer-tabs__content customizer-tabs__content--code" value="jsx">
              <CodeBlock label="JSX" code={generatedExample} language="tsx" />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </section>
  );
}

function InstallationShowcase() {
  const [origin, setOrigin] = useState("http://localhost:5173");

  useLayoutEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const installCommand = `pnpm dlx shadcn@latest add ${origin}/r/liquid-glass.json`;

  return (
    <section className="component-section installation-section" id="installation">
      <div className="section-heading">
        <h2>Install</h2>
        <p>
          Install via the shadcn Registry. The CLI copies the source into your
          app — no private runtime package.
        </p>
      </div>

      <div className="installation-stack">
        <CodeBlock label="Terminal" code={installCommand} language="bash" />
        <CodeBlock label="Usage" code={usageExample} language="tsx" />

        <div className="installation-packages">
          <div className="installation-packages__heading">
            <span>Registry packages</span>
            <span>Copy a package install command</span>
          </div>
          <div className="attachment-group">
            {registryPackages.map((item) => (
              <RegistryAttachment
                key={item.name}
                title={item.title}
                description={item.description}
                file={item.file}
                command={`pnpm dlx shadcn@latest add ${origin}/r/${item.file}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SiteMobileNav({
  activeValue,
  onNavigate,
}: {
  activeValue: string;
  onNavigate: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="site-nav-mobile__root" ref={rootRef}>
      <button
        type="button"
        className="site-nav-mobile__icon"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls="site-nav-mobile-menu"
        onClick={() => setOpen((current) => !current)}
      >
        <HugeiconsIcon
          icon={Menu01Icon}
          altIcon={Cancel01Icon}
          showAlt={open}
          size={20}
          color="currentColor"
          strokeWidth={1.75}
          aria-hidden
        />
      </button>

      {open ? (
        <nav
          id="site-nav-mobile-menu"
          className="site-nav-mobile__menu"
          aria-label="Primary"
        >
          {topNavigationItems.map((item) => (
            <a
              key={item.value}
              href={item.href}
              className={
                activeValue === item.value
                  ? "site-nav-mobile__link is-active"
                  : "site-nav-mobile__link"
              }
              onClick={(event) => {
                event.preventDefault();
                setOpen(false);
                onNavigate(item.value);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}
    </div>
  );
}

export function Playground() {
  const [topNavigationValue, setTopNavigationValue] = useState("menu");

  const navigateToSection = (value: string) => {
    setTopNavigationValue(value);
    document.getElementById(value)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <IOSPointer />
      <div className="static-backdrop" aria-hidden />

      <header className="site-navigation">
        <a className="site-brand" href="#top">
          LiquidGlass
        </a>

        <nav className="site-nav-links" aria-label="Primary">
          {topNavigationItems.map((item) => (
            <a
              key={item.value}
              href={item.href}
              className={
                topNavigationValue === item.value
                  ? "site-nav-link is-active"
                  : "site-nav-link"
              }
              onClick={(event) => {
                event.preventDefault();
                navigateToSection(item.value);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="site-nav-mobile">
          <SiteMobileNav
            activeValue={topNavigationValue}
            onNavigate={navigateToSection}
          />
        </div>
      </header>

      <main id="top">
        <section className="hero" id="menu">
          <div className="hero-media" aria-hidden="true">
            <img
              className="hero-media__image"
              src="/images/hero-bg.jpg"
              alt=""
            />
            <div className="hero-media__veil" />
          </div>
          <div className="hero-inner">
            <div className="hero-copy">
              <h1>Liquid Glass for the web.</h1>
              <p className="hero-lede">
                Native-feeling glass surfaces — crafted, customizable, source
                you own.
              </p>
              <a
                className="hero-cta"
                href="#installation"
                data-ios-pointer-target=""
              >
                <LiquidGlass
                  width={120}
                  height={44}
                  borderRadius={22}
                  material={heroCtaMaterial}
                  className="hero-cta__glass"
                >
                  <span className="hero-cta__label">Install</span>
                </LiquidGlass>
              </a>
            </div>
            <HeroFloatStage />
          </div>
        </section>

        <MaterialAttributesCarousel />
        <PrebuiltComponentsCarousel />
        <CustomizeShowcase />
        <InstallationShowcase />

        <footer>
          <span>LiquidGlass</span>
          <span>shadcn Registry</span>
        </footer>
      </main>
    </>
  );
}
