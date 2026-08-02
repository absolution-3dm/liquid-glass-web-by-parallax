"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import { LiquidGlass } from "../registry/liquid-glass/liquid-glass";
import {
  resolveGlassMaterial,
  type GlassMaterialName,
} from "../registry/liquid-glass/materials/materials";
import { GlassSegmentedControl } from "../registry/liquid-glass/compositions/glass-segmented-control";
import { GlassShellBackdrop } from "../registry/liquid-glass/compositions/glass-shell-backdrop";
import { GlassIconPill } from "../registry/liquid-glass/compositions/glass-icon-pill";
import { LiquidGlassCapsule } from "../registry/liquid-glass/compositions/liquid-glass-capsule";
import { IOSPointer } from "../registry/liquid-glass/compositions/ios-pointer";
import {
  MorphMenuHoverFill,
  useMorphMenuHover,
} from "../registry/liquid-glass/compositions/morph-menu-hover";
import { MorphMenu } from "../registry/liquid-glass/compositions/morph-menu";
import { GlassSlider } from "./components/glass-slider";
import { CustomizeColorField } from "./components/customize-color-field";
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
  { value: "components", label: "Components", href: "#components" },
  { value: "customize", label: "Customize", href: "#customize" },
  { value: "installation", label: "Install", href: "#installation" },
];

const customizerPresets = ["regular", "navigation", "control", "panel"] as const;
type CustomizerPreset = (typeof customizerPresets)[number];

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

const bentoIconPills = [
  { icon: Home01Icon, label: "Home" },
  { icon: Search01Icon, label: "Search" },
  { icon: Settings01Icon, label: "Settings" },
] as const;

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

function HeroOrbitTilt({
  className,
  lift = 0,
  rotateX,
  rotateY,
  springX,
  springY,
  children,
}: {
  className: string;
  lift?: number;
  rotateX: MotionValue<number>;
  rotateY: MotionValue<number>;
  springX: MotionValue<number>;
  springY: MotionValue<number>;
  children: ReactNode;
}) {
  const x = useTransform(springX, (value) => value * lift);
  const y = useTransform(springY, (value) => value * lift);

  return (
    <motion.div
      className={className}
      style={{
        rotateX,
        rotateY,
        x,
        y,
        // Parallel / orthographic: no vanishing-point perspective.
        transformPerspective: 0,
        transformOrigin: "50% 50%",
      }}
    >
      {children}
    </motion.div>
  );
}

function HeroFloatStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const [segmentValue, setSegmentValue] = useState("optics");
  const reduceMotionRef = useRef(false);

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const springX = useSpring(pointerX, { stiffness: 320, damping: 32, mass: 0.55 });
  const springY = useSpring(pointerY, { stiffness: 320, damping: 32, mass: 0.55 });
  const rotateX = useTransform(springY, (value) => 16 + value * -5);
  const rotateY = useTransform(springX, (value) => -24 + value * 8);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    reduceMotionRef.current = media.matches;
    const onChange = () => {
      reduceMotionRef.current = media.matches;
      if (media.matches) {
        pointerX.set(0);
        pointerY.set(0);
        springX.jump(0);
        springY.jump(0);
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [pointerX, pointerY, springX, springY]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const onPointerMove = (event: PointerEvent) => {
      if (reduceMotionRef.current) return;
      const rect = stage.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      pointerX.set(Math.max(-1, Math.min(1, nx)));
      pointerY.set(Math.max(-1, Math.min(1, ny)));
    };

    const onPointerLeave = () => {
      pointerX.set(0);
      pointerY.set(0);
    };

    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerleave", onPointerLeave);
    return () => {
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [pointerX, pointerY]);

  return (
    <div className="hero-orbit" ref={stageRef} aria-label="LiquidGlass component preview">
      <div className="hero-orbit__tilt">
        <HeroOrbitTilt
          className="hero-orbit__plate"
          rotateX={rotateX}
          rotateY={rotateY}
          springX={springX}
          springY={springY}
        >
          <img
            className="hero-orbit__scene"
            src="/images/shan-shui-summer-mountains.jpg"
            alt="Summer Mountains, attributed to Qu Ding — Song dynasty shan shui"
          />
        </HeroOrbitTilt>

        <HeroOrbitTilt
          className="hero-orbit__layer hero-orbit__layer--menu"
          lift={18}
          rotateX={rotateX}
          rotateY={rotateY}
          springX={springX}
          springY={springY}
        >
          <HeroMorphMenu />
        </HeroOrbitTilt>

        <HeroOrbitTilt
          className="hero-orbit__layer hero-orbit__layer--segment"
          lift={18}
          rotateX={rotateX}
          rotateY={rotateY}
          springX={springX}
          springY={springY}
        >
          <GlassSegmentedControl
            items={segmentItems}
            value={segmentValue}
            onValueChange={setSegmentValue}
            itemWidth={100}
            itemHeight={40}
            padding={4}
            radialExpansion={8}
            material="navigation"
            pressedMaterial="selectionPressed"
            className="hero-orbit__segment"
            itemClassName="hero-orbit__segment-item"
          />
        </HeroOrbitTilt>

        <HeroOrbitTilt
          className="hero-orbit__layer hero-orbit__layer--icons"
          lift={18}
          rotateX={rotateX}
          rotateY={rotateY}
          springX={springX}
          springY={springY}
        >
          {bentoIconPills.map(({ icon, label }) => (
            <button
              key={label}
              type="button"
              className="bento-icon-button"
              data-ios-pointer-target=""
              aria-label={label}
            >
              <GlassIconPill size={44} material="navigation">
                <HugeiconsIcon
                  icon={icon}
                  size={18}
                  color="currentColor"
                  strokeWidth={1.75}
                  className="bento-icon-glyph"
                  aria-hidden
                />
              </GlassIconPill>
            </button>
          ))}
        </HeroOrbitTilt>
      </div>
    </div>
  );
}

function HeroMorphMenu() {
  const [open, setOpen] = useState(true);
  const { clearHoveredItem, hoveredItem, syncHoveredItem } = useMorphMenuHover();

  return (
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
      closeOnClickOutside={false}
    >
      <MorphMenu.Container
        buttonSize={48}
        menuWidth={248}
        menuRadius={28}
        buttonRadius={24}
        offset={12}
        className="hero-orbit__menu-shell"
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
  );
}

function BentoMorphMenu() {
  const [open, setOpen] = useState(false);
  const { clearHoveredItem, hoveredItem, syncHoveredItem } = useMorphMenuHover();

  return (
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
    >
      <MorphMenu.Container
        buttonSize={48}
        menuWidth={248}
        menuRadius={28}
        buttonRadius={24}
        offset={12}
        className="bento-menu__shell"
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
  );
}

function ComponentsBento() {
  const [segmentValue, setSegmentValue] = useState("motion");
  const capsuleConstraintsRef = useRef<HTMLDivElement>(null);
  const capsulePlacedRef = useRef(false);
  const capsuleWidth = 168;
  const capsuleHeight = 120;
  const [capsuleOrigin, setCapsuleOrigin] = useState<{ x: number; y: number } | null>(
    null,
  );

  useLayoutEffect(() => {
    const el = capsuleConstraintsRef.current;
    if (!el) return;

    const place = () => {
      if (capsulePlacedRef.current || el.clientWidth <= 0 || el.clientHeight <= 0) {
        return;
      }
      capsulePlacedRef.current = true;
      setCapsuleOrigin({
        x: Math.max(0, (el.clientWidth - capsuleWidth) / 2),
        y: Math.max(0, (el.clientHeight - capsuleHeight) / 2),
      });
    };

    place();
    const ro = new ResizeObserver(place);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <section className="component-section" id="components">
      <div className="section-heading">
        <h2>Components</h2>
        <p>
          Live registry surfaces on a static scene — refraction without an
          animating backdrop.
        </p>
      </div>

      <div className="bento">
        <div className="bento__scene-clip" aria-hidden="true">
          <img
            className="bento__scene"
            src="/images/pexels-bento-scene.jpg"
            alt=""
          />
        </div>

        <article className="bento__cell bento__cell--capsule">
          <span className="bento__label">Capsule</span>
          <div className="bento__stage" ref={capsuleConstraintsRef}>
            {capsuleOrigin ? (
              <LiquidGlassCapsule
                width={capsuleWidth}
                height={capsuleHeight}
                borderRadius={60}
                initial={capsuleOrigin}
                dragConstraints={capsuleConstraintsRef}
                material="navigation"
              >
                <span className="bento-capsule__hint">Drag</span>
              </LiquidGlassCapsule>
            ) : null}
          </div>
        </article>

        <article className="bento__cell bento__cell--panel">
          <span className="bento__label">Panel</span>
          <div className="bento__stage bento__stage--panel">
            <LiquidGlass
              width="100%"
              height={200}
              borderRadius={28}
              material="panel"
              className="bento-panel__glass"
            >
              <div className="panel-content">
                <div>
                  <span className="panel-kicker">Material</span>
                  <h3>Panel</h3>
                </div>
                <p className="panel-lede">
                  Quiet content surface — Chromium refraction, frost elsewhere.
                </p>
              </div>
            </LiquidGlass>
          </div>
        </article>

        <article className="bento__cell bento__cell--segment">
          <span className="bento__label">Segment</span>
          <div className="bento__stage bento__stage--center">
            <GlassSegmentedControl
              items={segmentItems}
              value={segmentValue}
              onValueChange={setSegmentValue}
              itemWidth={100}
              itemHeight={40}
              padding={4}
              radialExpansion={8}
              material="navigation"
              pressedMaterial="selectionPressed"
              itemClassName="segment-item"
            />
          </div>
        </article>

        <article className="bento__cell bento__cell--menu">
          <span className="bento__label">Morph menu</span>
          <div className="bento__stage bento__stage--menu">
            <BentoMorphMenu />
          </div>
        </article>

        <article className="bento__cell bento__cell--icons">
          <span className="bento__label">Icon pill</span>
          <div className="bento__stage bento__stage--center bento-icon-row">
            {bentoIconPills.map(({ icon, label }) => (
              <button
                key={label}
                type="button"
                className="bento-icon-button"
                data-ios-pointer-target=""
                aria-label={label}
              >
                <GlassIconPill size={48} material="navigation">
                  <HugeiconsIcon
                    icon={icon}
                    size={20}
                    color="currentColor"
                    strokeWidth={1.75}
                    className="bento-icon-glyph"
                    aria-hidden
                  />
                </GlassIconPill>
              </button>
            ))}
          </div>
        </article>
      </div>
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
          <label className="customizer-select">
            <span>Preset</span>
            <select
              value={preset}
              onChange={(event) => selectPreset(event.currentTarget.value as CustomizerPreset)}
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
        </div>
      </div>

      <div className="customizer-code">
        <CodeBlock label="JSX" code={generatedExample} language="tsx" />
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
          Distributed through the shadcn Registry. The CLI copies the source into
          your app — no private runtime package.
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
      </header>

      <main id="top">
        <section className="hero" id="menu">
          <div className="hero-copy">
            <h1>LiquidGlass</h1>
            <p className="hero-lede">
              Optical surfaces for the web. Install the source, own the
              refraction.
            </p>
            <a className="hero-cta" href="#installation">
              Install
            </a>
          </div>
          <HeroFloatStage />
        </section>

        <ComponentsBento />
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
