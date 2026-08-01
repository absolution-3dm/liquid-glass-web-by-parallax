"use client";

import { useState } from "react";
import { LiquidGlass } from "../registry/liquid-glass/liquid-glass";
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

function MenuIcon({ open }: { open: boolean }) {
  return (
    <span className={`menu-icon ${open ? "menu-icon--open" : ""}`} aria-hidden>
      <i />
      <i />
    </span>
  );
}

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" aria-hidden>
      <path d="M4 10h11M11 6l4 4-4 4" />
    </svg>
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
          点击切换选中项；按住当前项并水平拖动，可观察玻璃抬升、边界阻尼与释放吸附。
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
          <p>真实默认状态，没有额外覆盖样式。</p>
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
          <p>点击任意分段，观察真实切换时间线。</p>
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
          <p>按住当前选中项并拖动，展示真实 pressed 状态。</p>
        </article>
      </div>
    </section>
  );
}

function PanelShowcase() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="component-section" id="panel">
      <div className="section-heading">
        <div>
          <span className="eyebrow">03 · Responsive surface</span>
          <h2>Panel</h2>
        </div>
        <p>
          同一个 panel 材质在内容增加和容器改变尺寸时重建贴图；折射仍保持独立 X/Y 通道。
        </p>
      </div>

      <div className={`panel-stage ${expanded ? "panel-stage--expanded" : ""}`}>
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
                <span className="panel-kicker">Live material</span>
                <h3>Optical field</h3>
              </div>
              <span className="status-badge">
                <i />
                Stable
              </span>
            </div>

            <div className="panel-metric">
              <strong>{expanded ? "1.465" : "X / Y"}</strong>
              <span>{expanded ? "navigation scale" : "isolated textures"}</span>
            </div>

            <div className="panel-bars" aria-hidden>
              <i style={{ height: "42%" }} />
              <i style={{ height: "66%" }} />
              <i style={{ height: "54%" }} />
              <i style={{ height: expanded ? "92%" : "74%" }} />
              <i style={{ height: expanded ? "78%" : "48%" }} />
              <i style={{ height: expanded ? "64%" : "36%" }} />
            </div>

            {expanded ? (
              <div className="panel-details">
                <span>Chromium</span>
                <strong>Sequential displacement</strong>
                <span>Safari / Firefox</span>
                <strong>CSS blur fallback</strong>
              </div>
            ) : null}

            <button
              type="button"
              className="panel-action"
              data-ios-pointer-target
              aria-expanded={expanded}
              onClick={() => setExpanded((current) => !current)}
            >
              {expanded ? "Collapse panel" : "Expand panel"}
              <ArrowIcon />
            </button>
          </div>
        </LiquidGlass>
      </div>
    </section>
  );
}

export function Playground() {
  return (
    <>
      <IOSPointer />
      <div className="ambient ambient--coral" aria-hidden />
      <div className="ambient ambient--cyan" aria-hidden />
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

        <LiquidGlass
          width={232}
          height={48}
          borderRadius={24}
          material="navigation"
          className="desktop-navigation-glass"
        >
          <nav className="desktop-links" aria-label="Component sections">
            <a href="#menu">Menu</a>
            <a href="#segment-control">Segment</a>
            <a href="#panel">Panel</a>
          </nav>
        </LiquidGlass>

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
              一页检查菜单展开、Segment Control 的点击与按压，以及大尺寸 Panel 的动态折射。
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

        <footer>
          <span>LiquidGlass Registry</span>
          <span>Primitive · Navigation · Menu · Panel</span>
        </footer>
      </main>
    </>
  );
}
