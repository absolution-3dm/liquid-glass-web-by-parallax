# Parallax Glass

A source-owned liquid glass primitive and a set of interactive compositions for
React. It is distributed through the [shadcn Registry](https://ui.shadcn.com/docs/registry),
so the CLI copies the implementation into your project: there is no private
runtime package and the installed source remains yours to inspect and modify.

Parallax Glass combines live backdrop refraction, tint, blur, specular edges,
pointer lighting, material presets, and responsive lens-map generation. Chromium
gets the full SVG displacement effect; Safari and Firefox receive a deliberate
CSS blur, tint, and highlight fallback.

## Features

- Live, aspect-correct backdrop refraction in Chromium
- CSS blur/tint/highlight fallback for Safari and Firefox
- Five physical thickness presets and four semantic material recipes
- Explicit dark and light material modes
- Per-instance material and pointer-highlight overrides
- Automatic resizing, lens-map caching, and off-screen work suspension
- Optional animated compositions for navigation, capsules, and morphing menus
- Source-only shadcn Registry distribution with no project-specific runtime

## Install from the registry

Every registry item is self-contained. Install only the primitive, or install a
composition and let the shadcn CLI copy its required files and dependencies.

When this repository is running locally:

```bash
pnpm install
pnpm registry:build
pnpm dev
```

Then, from the shadcn-enabled application that will consume the component:

```bash
pnpm dlx shadcn@latest add http://localhost:5173/r/liquid-glass.json
```

For a deployed registry, replace `http://localhost:5173` with the registry's
origin. Generated registry items are written to `public/r/` by
`pnpm registry:build`.

## Basic usage

The default registry target is `components/liquid-glass/`. Adjust the import if
your shadcn aliases differ.

```tsx
import { LiquidGlass } from "@/components/liquid-glass/liquid-glass"

export function GlassButton() {
  return (
    <LiquidGlass
      width={240}
      height={72}
      borderRadius={24}
      material="control"
      materialMode="dark"
    >
      <button type="button">Open project</button>
    </LiquidGlass>
  )
}
```

`LiquidGlass` is a client component. Its children remain sharp and are rendered
above the optical surface. Use `stateLayer` for selection chrome between the
glass and the content, and `overlayLayer` for interactive glass that must sit
above the content.

### Responsive sizing

`width` and `height` accept either numbers (CSS pixels) or CSS size strings.
String sizes need a measurable parent layout.

```tsx
<div style={{ width: "min(92vw, 720px)", height: 180 }}>
  <LiquidGlass
    width="100%"
    height="100%"
    borderRadius={32}
    material="panel"
  >
    <div>Responsive glass panel</div>
  </LiquidGlass>
</div>
```

The component observes its layout box and rebuilds the optical map when its
actual size changes. Prefer animating a wrapper with CSS transforms when an
interaction only needs to move, squash, or scale the glass; this avoids baking a
new map for every animation frame.

## Materials

Pass a preset name to `material`, or extend a preset with local overrides.

| Kind | Presets | Intended use |
| --- | --- | --- |
| Physical | `ultraThin`, `thin`, `regular`, `thick`, `ultraThick` | Increasing optical weight, blur, and background separation |
| Semantic | `navigation`, `control`, `panel`, `selectionPressed` | Navigation chrome, compact controls, floating panels, and pressed selection states |

```tsx
<LiquidGlass
  width={320}
  height={112}
  material={{
    preset: "panel",
    blur: 2,
    chroma: 0.12,
    tint: 0.46,
    fill: "#0a1020",
  }}
>
  Custom material
</LiquidGlass>
```

Available material parameters are `scale`, `depth`, `curvature`, `splay`,
`chroma`, `blur`, `glow`, `edgeHighlight`, `specularAngle`, `specular`, `tint`,
and `fill`. Colors use the `#RRGGBB` form. `materialMode="light"` applies the
checked-in light transform to the selected preset; it does not read or change
the application's global theme.

## Pointer highlight

Pointer lighting is enabled by default and can be tuned per surface. Partial
objects merge with the shared defaults.

```tsx
<LiquidGlass
  width={280}
  height={88}
  material="navigation"
  pointerHighlight={{ radius: 110, hoverStrength: 0.24 }}
>
  Softer pointer light
</LiquidGlass>

<LiquidGlass pointerHighlight={false}>No pointer light</LiquidGlass>
```

Disabling it is useful for non-interactive surfaces and removes the associated
backdrop-filter work entirely.

## API

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Sharp content above the glass |
| `stateLayer` | `ReactNode` | — | Selection or state chrome between the optical layer and content |
| `overlayLayer` | `ReactNode` | — | Interactive layer above the content |
| `width` | `number \| string` | `200` | Surface width; numbers are pixels |
| `height` | `number \| string` | `80` | Surface height; numbers are pixels |
| `borderRadius` | `number` | `20` | Corner radius in pixels |
| `material` | `GlassMaterialInput` | `"regular"` | Preset, recipe, or preset with overrides |
| `materialMode` | `"dark" \| "light"` | `"dark"` | Explicit material appearance |
| `backdrop` | `boolean` | `true` | Enables live backdrop sampling and its browser fallback |
| `pointerHighlight` | `Partial<GlassPointerHighlightParams> \| false` | shared defaults | Per-instance pointer lighting, or `false` to disable |
| `className` | `string` | `""` | Class name for the root surface |
| `style` | `CSSProperties` | `{}` | Inline styles for the root surface |
| `refractionProgress` | motion-value-like `0–1` source | — | Animates displacement strength without resizing the map |
| `onDisplacementMapChange` | callback | — | Development callback fired after map regeneration |
| `engine` | `Partial<GlassEngineParams>` | shared defaults | Development-only engine preview overrides |
| `pointerHighlightPreview` | `{ x, y, strength? }` | — | Drives a normalized fixed highlight position for demos or stories |

The public material types and `resolveGlassMaterial` helper are exported from
the same module as `LiquidGlass`.

## Registry items

| Item | Motion dependency | What it installs |
| --- | --- | --- |
| `liquid-glass` | No | Core optical primitive, materials, browser detection, and refraction engine |
| `liquid-glass-icon-pill` | No | Circular icon-action surface built on the primitive |
| `liquid-glass-magnetic-pointer` | No | Fine-pointer attraction, press deformation, and spring return |
| `liquid-glass-navigation` | Yes | Draggable segmented navigation with elastic bounds and spring snapping |
| `liquid-glass-capsule` | Yes | Free dragging, press squish, velocity deformation, and leash utilities |
| `liquid-glass-menu` | Yes | Compound morph menu with a dynamically resizing glass shell |

Install a composition by changing the registry filename, for example:

```bash
pnpm dlx shadcn@latest add http://localhost:5173/r/liquid-glass-navigation.json
```

Motion is scoped to the items that use it. Installing the core primitive, icon
pill, or magnetic pointer does not add Motion.

See [the composition guide](docs/liquid-glass-compositions.md) for component
boundaries and dependency details.

## Browser behavior

| Browser engine | Rendering path |
| --- | --- |
| Chromium | Live SVG backdrop displacement, chromatic refraction, blur, tint, specular edge, and pointer lighting |
| Safari / WebKit | CSS backdrop blur with tint, highlight, and a high-density specular overlay |
| Firefox | CSS backdrop blur with tint and highlight |

Safari and Firefox do not currently apply SVG reference filters to a real
backdrop, so their fallback intentionally does not claim to provide refraction.
The component never screenshots, clones, rasterizes, or mutates the page content
behind the glass.

The Chromium graph uses independently encoded X and Y lens maps and an
edge-dependent displacement order to avoid known GPU pipeline artifacts. Keep
that graph intact when customizing the engine. The implementation notes and
regression requirements are documented in
[docs/glass-refraction.md](docs/glass-refraction.md).

## Performance guidance

- Prefer the semantic presets before overriding engine-level values.
- Disable `pointerHighlight` on surfaces that do not need it.
- Transform a stable-size wrapper for drag and squish effects instead of
  continuously changing the component's layout dimensions.
- Avoid stacking many overlapping, continuously animated backdrop surfaces;
  each front surface samples the already-filtered output behind it.
- Keep high-contrast content crossing all four edges in Chromium visual checks.
  Automated pixel tests cannot reproduce every GPU rendering regression.

The engine caps displacement-map area for large surfaces and suspends live
backdrop work outside a viewport margin. These optimizations do not alter the
material presets or the axis-isolated filter structure.

## Local development

```bash
pnpm install
pnpm dev
```

The Vite playground runs at `http://localhost:5173` by default.

Run the full verification set before publishing registry changes:

```bash
pnpm test
pnpm typecheck
pnpm build
pnpm registry:build
```

Repository layout:

```text
registry/liquid-glass/   Installable primitive and compositions
src/                     Vite playground and material customizer
docs/                    Refraction and composition implementation notes
public/r/                Generated shadcn Registry artifacts
registry.json            Registry item definitions
```

`registry/liquid-glass/` must remain portable copied source. Do not add a
private npm runtime, a Next.js route dependency, or project-specific import
aliases inside that directory.
