"use client";

import { useEffect, useState } from "react";
import { MeshGradient } from "@paper-design/shaders-react";
import { LiquidGlass } from "../registry/liquid-glass/liquid-glass";
import {
  resolveGlassMaterial,
  type GlassMaterialName,
} from "../registry/liquid-glass/materials/materials";
import { GlassSegmentedControl } from "../registry/liquid-glass/compositions/glass-segmented-control";
import { GlassShellBackdrop } from "../registry/liquid-glass/compositions/glass-shell-backdrop";
import { IOSPointer } from "../registry/liquid-glass/compositions/ios-pointer";
import {
  MorphMenuHoverFill,
  useMorphMenuHover,
} from "../registry/liquid-glass/compositions/morph-menu-hover";
import { MorphMenu } from "../registry/liquid-glass/compositions/morph-menu";

const segmentItems = [
  { value: "overview", label: "Overview" },
  { value: "motion", label: "Motion" },
  { value: "optics", label: "Optics" },
];

const menuItems = ["Overview", "Components", "Installation", "Documentation"];

const topNavigationItems = [
  { value: "menu", label: "Menu", href: "#menu" },
  { value: "segment-control", label: "Segment", href: "#segment-control" },
  { value: "panel", label: "Panel", href: "#panel" },
  { value: "customize", label: "Customize", href: "#customize" },
  { value: "installation", label: "Install", href: "#installation" },
];

const customizerPresets = ["regular", "navigation", "control", "panel"] as const;
type CustomizerPreset = (typeof customizerPresets)[number];

const installCommand =
  "pnpm dlx shadcn@latest add <registry-url>/r/liquid-glass.json";

const importExample = `import { LiquidGlass } from
  "@/components/liquid-glass/liquid-glass"`;

const usageExample = `<LiquidGlass
  width={320}
  height={96}
  borderRadius={32}
  material="panel"
>
  Your content
</LiquidGlass>`;

function DynamicGradientBackground() {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <div className="dynamic-gradient" aria-hidden>
      <MeshGradient
        width="100%"
        height="100%"
        colors={["#071018", "#173646", "#4d7680", "#6f4651", "#0b1720"]}
        distortion={0.72}
        swirl={0.34}
        grainMixer={0.1}
        grainOverlay={0.06}
        speed={reducedMotion ? 0 : 0.08}
        fit="cover"
        scale={1.18}
        maxPixelCount={3_200_000}
      />
      <div className="dynamic-gradient__scrim" />
    </div>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className={`menu-icon ${open ? "menu-icon--open" : ""}`} aria-hidden>
      <i />
      <i />
    </span>
  );
}

function NavigationMenu() {
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
      anchor="end"
      visualDuration={0.28}
      bounce={0}
    >
      <MorphMenu.Container
        buttonSize={{ width: 116, height: 48 }}
        menuWidth={268}
        menuRadius={28}
        buttonRadius={24}
        offset={12}
        className="navigation-menu__shell"
        backdrop={<GlassShellBackdrop borderRadius={28} material="navigation" />}
      >
        <MorphMenu.Trigger
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          className="navigation-menu__trigger"
        >
          <MenuIcon open={open} />
          <span>{open ? "Close" : "Menu"}</span>
        </MorphMenu.Trigger>

        <MorphMenu.Content
          className="navigation-menu__content"
          onPointerLeave={clearHoveredItem}
        >
          <div className="navigation-menu__heading">
            <span>Navigation</span>
            <small>04 sections</small>
          </div>
          <div className="navigation-menu__items">
            <MorphMenuHoverFill hoveredItem={hoveredItem} />
            {menuItems.map((item, index) => (
              <MorphMenu.Item
                key={item}
                className="navigation-menu__item"
                onPointerEnter={syncHoveredItem}
              >
                <span>{item}</span>
                <span className="navigation-menu__index">0{index + 1}</span>
              </MorphMenu.Item>
            ))}
          </div>
        </MorphMenu.Content>
      </MorphMenu.Container>
    </MorphMenu.Root>
  );
}

function SegmentShowcase() {
  const [restValue, setRestValue] = useState("overview");
  const [clickedValue, setClickedValue] = useState("motion");
  const [pressedValue, setPressedValue] = useState("optics");

  return (
    <section className="component-section" id="segment-control">
      <div className="section-heading">
        <div>
          <span className="eyebrow">02 · Interactive control</span>
          <h2>Segment Control</h2>
        </div>
        <p>
          Click to change selection. Hold and drag the active item to inspect lift,
          bounded resistance, and spring snapping.
        </p>
      </div>

      <div className="segment-state-grid" aria-label="Segment control states">
        <article className="segment-state-card">
          <div className="segment-state-card__heading">
            <div>
              <span>Rest</span>
              <em>Default</em>
            </div>
            <strong>{restValue}</strong>
          </div>
          <GlassSegmentedControl
            items={segmentItems}
            value={restValue}
            onValueChange={setRestValue}
            itemWidth={88}
            itemHeight={40}
            padding={4}
            radialExpansion={8}
            material="navigation"
            pressedMaterial="selectionPressed"
            itemClassName="segment-item"
          />
          <p>The real default state with no presentation overrides.</p>
        </article>

        <article className="segment-state-card">
          <div className="segment-state-card__heading">
            <div>
              <span>Clicked</span>
              <em>Selected</em>
            </div>
            <strong>{clickedValue}</strong>
          </div>
          <GlassSegmentedControl
            items={segmentItems}
            value={clickedValue}
            onValueChange={setClickedValue}
            itemWidth={88}
            itemHeight={40}
            padding={4}
            radialExpansion={8}
            material="navigation"
            pressedMaterial="selectionPressed"
            itemClassName="segment-item"
          />
          <p>Click any segment to run the production selection timeline.</p>
        </article>

        <article className="segment-state-card segment-state-card--pressed">
          <div className="segment-state-card__heading">
            <div>
              <span>Pressed</span>
              <em>Hold & drag</em>
            </div>
            <strong>{pressedValue}</strong>
          </div>
          <GlassSegmentedControl
            items={segmentItems}
            value={pressedValue}
            onValueChange={setPressedValue}
            itemWidth={88}
            itemHeight={40}
            padding={4}
            radialExpansion={8}
            material="navigation"
            pressedMaterial="selectionPressed"
            pressedPreview
            itemClassName="segment-item"
          />
          <p>The production pressed state, held through the component MotionValue.</p>
        </article>
      </div>
    </section>
  );
}

function PanelShowcase() {
  return (
    <section className="component-section" id="panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">03 · Responsive surface</span>
          <h2>Panel</h2>
        </div>
        <p>
          A stable, non-interactive content surface. No dragging, deformation, or
          magnetic attraction—only the Panel material itself.
        </p>
      </div>

      <div className="panel-stage">
        <LiquidGlass
          width="100%"
          height="100%"
          borderRadius={36}
          material="panel"
          className="panel-glass"
        >
          <div className="panel-content">
            <div className="panel-content__topline">
              <div>
                <span className="panel-kicker">Material · Panel</span>
                <h3>Refraction surface</h3>
              </div>
              <span className="status-badge">
                <i />
                Passive
              </span>
            </div>

            <div className="panel-summary">
              <strong>X / Y</strong>
              <p>Independent textures, sequential displacement passes.</p>
            </div>

            <div className="panel-specs">
              <div>
                <span>Chromium</span>
                <strong>SVG refraction</strong>
              </div>
              <div>
                <span>Safari · Firefox</span>
                <strong>CSS blur fallback</strong>
              </div>
            </div>
          </div>
        </LiquidGlass>
      </div>
    </section>
  );
}

function CodeBlock({ label, code }: { label: string; code: string }) {
  return (
    <div className="code-block">
      <div className="code-block__header">
        <span>{label}</span>
        <small>Copy and own the source</small>
      </div>
      <pre>
        <code>{code}</code>
      </pre>
    </div>
  );
}

type SliderControlProps = {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display?: string;
  onChange: (value: number) => void;
};

function SliderControl({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: SliderControlProps) {
  return (
    <label className="customizer-control">
      <span>
        <strong>{label}</strong>
        <output>{display ?? value.toFixed(2)}</output>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
      />
    </label>
  );
}

function CustomizeShowcase() {
  const defaults = resolveGlassMaterial("regular");
  const [preset, setPreset] = useState<CustomizerPreset>("regular");
  const [scale, setScale] = useState(defaults.scale);
  const [blur, setBlur] = useState(defaults.blur);
  const [tint, setTint] = useState(defaults.tint);
  const [chroma, setChroma] = useState(defaults.chroma);
  const [fill, setFill] = useState(defaults.fill);
  const [borderRadius, setBorderRadius] = useState(36);

  const selectPreset = (next: CustomizerPreset) => {
    const material = resolveGlassMaterial(next);
    setPreset(next);
    setScale(material.scale);
    setBlur(material.blur);
    setTint(material.tint);
    setChroma(material.chroma);
    setFill(material.fill);
  };

  const material = { preset, scale, blur, tint, chroma, fill } satisfies {
    preset: GlassMaterialName;
    scale: number;
    blur: number;
    tint: number;
    chroma: number;
    fill: string;
  };

  const generatedExample = `<LiquidGlass
  width={340}
  height={180}
  borderRadius={${borderRadius}}
  material={{
    preset: "${preset}",
    scale: ${scale.toFixed(2)},
    blur: ${blur.toFixed(1)},
    tint: ${tint.toFixed(2)},
    chroma: ${chroma.toFixed(2)},
    fill: "${fill}"
  }}
/>`;

  return (
    <section className="component-section" id="customize">
      <div className="section-heading">
        <div>
          <span className="eyebrow">04 · Interactive playground</span>
          <h2>Customize the glass.</h2>
        </div>
        <p>
          Start with a checked-in material preset, then tune supported per-instance
          overrides. The generated JSX stays on the public LiquidGlass API.
        </p>
      </div>

      <div className="customizer-layout">
        <div className="customizer-preview">
          <img
            className="customizer-preview__scene"
            src="/images/pexels-gradient-1526.jpg"
            alt=""
            aria-hidden="true"
          />
          <LiquidGlass
            width="min(340px, calc(100% - 32px))"
            height={180}
            borderRadius={borderRadius}
            material={material}
            className="customizer-preview__glass"
          >
            <div className="customizer-preview__content">
              <span>Live preview</span>
              <strong>{preset}</strong>
              <small>Adjust the controls to update this surface</small>
            </div>
          </LiquidGlass>
        </div>

        <div className="customizer-controls">
          <label className="customizer-select">
            <span>Material preset</span>
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

          <div className="customizer-sliders">
            <SliderControl label="Refraction scale" value={scale} min={0} max={3} step={0.01} onChange={setScale} />
            <SliderControl label="Backdrop blur" value={blur} min={0} max={8} step={0.1} display={`${blur.toFixed(1)} px`} onChange={setBlur} />
            <SliderControl label="Tint" value={tint} min={0} max={1} step={0.01} onChange={setTint} />
            <SliderControl label="Chromatic aberration" value={chroma} min={0} max={1} step={0.01} onChange={setChroma} />
            <SliderControl label="Border radius" value={borderRadius} min={12} max={90} step={1} display={`${borderRadius} px`} onChange={setBorderRadius} />
          </div>

          <label className="customizer-color">
            <span>Glass fill</span>
            <span>
              <input type="color" value={fill} onChange={(event) => setFill(event.currentTarget.value)} />
              <output>{fill}</output>
            </span>
          </label>
        </div>
      </div>

      <div className="customizer-code">
        <CodeBlock label="Generated JSX" code={generatedExample} />
      </div>
    </section>
  );
}

function InstallationShowcase() {
  return (
    <section className="component-section installation-section" id="installation">
      <div className="section-heading">
        <div>
          <span className="eyebrow">05 · Installation</span>
          <h2>Install the source.</h2>
        </div>
        <p>
          LiquidGlass is distributed through a shadcn Registry. The CLI copies
          the complete implementation into your application—there is no private
          LiquidGlass runtime package.
        </p>
      </div>

      <div className="installation-grid">
        <article className="installation-card installation-card--primary">
          <div className="installation-card__step">
            <span>01</span>
            <div>
              <strong>Install the primitive</strong>
              <p>
                Replace <code>&lt;registry-url&gt;</code> with the origin hosting this
                Registry.
              </p>
            </div>
          </div>
          <CodeBlock label="Terminal" code={installCommand} />

          <div className="installation-card__step">
            <span>02</span>
            <div>
              <strong>Import the owned source</strong>
              <p>All files are installed under components/liquid-glass.</p>
            </div>
          </div>
          <CodeBlock label="React" code={importExample} />
        </article>

        <aside className="registry-items" aria-label="Registry items">
          <div className="registry-items__header">
            <span>Registry items</span>
            <small>Choose only what you need</small>
          </div>
          <ul>
            <li>
              <div>
                <strong>liquid-glass</strong>
                <span>Core optical primitive</span>
              </div>
              <em>No Motion</em>
            </li>
            <li>
              <div>
                <strong>liquid-glass-navigation</strong>
                <span>Segmented navigation and snapping</span>
              </div>
              <em>Motion</em>
            </li>
            <li>
              <div>
                <strong>liquid-glass-menu</strong>
                <span>Morph menu and dynamic glass shell</span>
              </div>
              <em>Motion</em>
            </li>
            <li>
              <div>
                <strong>liquid-glass-magnetic-pointer</strong>
                <span>Pointer attraction and spring return</span>
              </div>
              <em>No Motion</em>
            </li>
          </ul>
        </aside>
      </div>

      <div className="usage-example">
        <div className="usage-example__copy">
          <span className="eyebrow">03 · Render</span>
          <h3>Use it like local UI.</h3>
          <p>
            Materials, browser detection, and refraction math live beside the
            component, so the installed source can be inspected and changed in
            place.
          </p>
        </div>
        <CodeBlock label="Component" code={usageExample} />
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
      <DynamicGradientBackground />
      <div className="backdrop-grid" aria-hidden />

      <header className="site-navigation">
        <a className="brand-pill" href="#top" aria-label="LiquidGlass home">
          <LiquidGlass
            width="100%"
            height={48}
            borderRadius={24}
            material="navigation"
            className="brand-pill__glass"
          >
            <span className="brand-mark">L</span>
            <span>LiquidGlass</span>
          </LiquidGlass>
        </a>

        <GlassSegmentedControl
          items={topNavigationItems}
          value={topNavigationValue}
          onValueChange={navigateToSection}
          itemWidth={76}
          itemHeight={40}
          padding={4}
          radialExpansion={8}
          material="navigation"
          pressedMaterial="selectionPressed"
          className="desktop-navigation-glass"
          itemClassName="top-navigation-item"
        />

        <div className="navigation-menu">
          <NavigationMenu />
        </div>
      </header>

      <main id="top">
        <section className="hero" id="menu">
          <div className="hero-copy">
            <span className="eyebrow">Source-owned · shadcn registry</span>
            <h1>Glass components, in every state.</h1>
            <p>
              Inspect menu morphing, Segment Control selection and press states,
              and a stable Panel surface in one source-owned playground.
            </p>
          </div>

          <div className="hero-orbit" aria-hidden>
            <span>CHROMIUM</span>
            <span>X / Y</span>
            <span>FALLBACK</span>
          </div>

          <div className="menu-callout">
            <span className="menu-callout__line" />
            <div>
              <strong>Navigation Menu</strong>
              <p>Use the Menu control in the top-right corner.</p>
            </div>
          </div>
        </section>

        <SegmentShowcase />
        <PanelShowcase />
        <CustomizeShowcase />
        <InstallationShowcase />

        <footer>
          <span>LiquidGlass Registry</span>
          <span>Primitive · Navigation · Menu · Panel · Customize</span>
        </footer>
      </main>
    </>
  );
}
