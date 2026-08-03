# Parallax Glass shadcn Registry

A source-owned refractive glass primitive from the Parallax portfolio.
It ships through the shadcn Registry as editable source and does not publish or
require a project-specific npm runtime.

## Local verification

```bash
pnpm install
pnpm test
pnpm typecheck
pnpm build
pnpm registry:build
pnpm dev
```

After `registry:build`, the installable item is available at
`public/r/liquid-glass.json`. While the playground server is running, install
it into a shadcn project with:

```bash
pnpm dlx shadcn@latest add http://localhost:5173/r/liquid-glass.json
```

Import the installed primitive from its source-owned directory:

```tsx
import { LiquidGlass } from "@/components/liquid-glass/liquid-glass"

<LiquidGlass width={240} height={80} material="regular">
  Content
</LiquidGlass>
```

Chromium uses the axis-isolated SVG backdrop refraction path. Safari and
Firefox use the CSS blur/tint/highlight fallback documented in
[`docs/glass-refraction.md`](docs/glass-refraction.md).

## Composition items

The registry also builds source-owned composition items:

- `liquid-glass-icon-pill` (no Motion)
- `liquid-glass-magnetic-pointer` (no Motion; custom spring attraction)
- `liquid-glass-navigation` (Motion spring snapping)
- `liquid-glass-capsule` (Motion drag/squish)
- `liquid-glass-menu` (Motion morphing with the dynamic refraction shell)

See [`docs/liquid-glass-compositions.md`](docs/liquid-glass-compositions.md) for
the extraction boundary and dependency rationale.
