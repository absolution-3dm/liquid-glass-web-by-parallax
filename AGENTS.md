# LiquidGlass regression guard

This repository is the source distribution for a shadcn Registry primitive.
Consumers install and own the copied source; do not introduce a private npm
runtime package, a Next.js route dependency, or an `@/` import into
`registry/liquid-glass/`.

## Chromium refraction pipeline

The axis-isolated SVG graph in
`registry/liquid-glass/liquid-glass.tsx` is intentional and user-validated:

- Compute the optical field once, then encode independent opaque X and Y PNGs
  with `generateAxisLensMaps`.
- The X texture carries R/X and B/specular with neutral G. The Y texture carries
  G/Y with neutral R and B.
- Load X and Y through distinct `feImage` primitives. Never derive both axes
  from one combined image and never reuse one URL for both.
- Before displacement, force the unused channel to exactly `0.5` with
  `feComponentTransfer`; PNG channel 128 is not exactly 0.5.
- Keep X and Y in sequential `feDisplacementMap` primitives.
- Keep both edge-dependent orders: top/bottom uses Y→X, sides uses X→Y. Each
  chromatic channel has four displacement passes, and the edge-order alpha mask
  combines the finished branches arithmetically.

The source extraction snapshot uses `navigation.scale = 1.465` and
`navigation.blur = 1.5`. Earlier source documentation and a stale assertion
said `scale = 3`; commit `f5e7ba1` intentionally retuned the live material.
Do not change current presets or engine JSON as a workaround for a filter-graph
regression.

## Safari and Firefox boundary

Safari/WebKit and Firefox remain on the CSS blur/tint/highlight fallback until
they can apply SVG reference filters to a real backdrop. Never:

- apply `filter: url(...)` to page-content DOM behind the primitive;
- capture or clone the page with canvas, `html2canvas`, screenshots,
  `foreignObject`, or duplicated DOM;
- replace live page content with a duplicated image layer.

See `docs/glass-refraction.md` before changing refraction code. Automated tests
protect the encoded data and graph structure, but the Chromium GPU bug still
requires a visual check with high-contrast content crossing all four edges.
