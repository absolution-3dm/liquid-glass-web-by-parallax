import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const registry = JSON.parse(readFileSync("registry.json", "utf8")) as {
  items: Array<{
    name: string;
    dependencies?: string[];
    files: Array<{ path: string; target: string }>;
  }>;
};

const compositionSources = [
  "registry/liquid-glass/compositions/glass-icon-pill.tsx",
  "registry/liquid-glass/compositions/glass-segmented-control.tsx",
  "registry/liquid-glass/compositions/liquid-glass-capsule.tsx",
  "registry/liquid-glass/compositions/glass-shell-backdrop.tsx",
  "registry/liquid-glass/compositions/ios-pointer.tsx",
  "registry/liquid-glass/compositions/morph-menu/container.tsx",
  "registry/liquid-glass/compositions/morph-menu/parts.tsx",
];

describe("LiquidGlass composition registry", () => {
  it("keeps the base primitive motion-free", () => {
    const base = registry.items.find((item) => item.name === "liquid-glass");
    expect(base?.dependencies ?? []).not.toContain("motion");
    expect(readFileSync("registry/liquid-glass/liquid-glass.tsx", "utf8")).not.toMatch(
      /from ["'](?:motion|motion\/react|framer-motion)["']/,
    );
  });

  it("declares Motion only on animated composition items", () => {
    expect(registry.items.find((item) => item.name === "liquid-glass-icon-pill")?.dependencies ?? [])
      .not.toContain("motion");
    expect(registry.items.find((item) => item.name === "liquid-glass-magnetic-pointer")?.dependencies ?? [])
      .not.toContain("motion");
    for (const name of ["liquid-glass-navigation", "liquid-glass-capsule", "liquid-glass-menu"]) {
      expect(registry.items.find((item) => item.name === name)?.dependencies).toContain("motion");
    }
  });

  it("removes source-app aliases and route coupling", () => {
    const source = compositionSources.map((file) => readFileSync(file, "utf8")).join("\n");
    expect(source).not.toContain('from "@/');
    expect(source).not.toMatch(/next-intl|next\/navigation|lenis|Hugeicons/);
  });

  it("installs composition source under components/liquid-glass", () => {
    for (const item of registry.items) {
      for (const file of item.files) {
        expect(file.target).toMatch(/^components\/liquid-glass\//);
      }
    }
  });

  it("keeps separate axis textures and sequential displacement in the morph shell", () => {
    const source = readFileSync(
      "registry/liquid-glass/compositions/glass-shell-backdrop.tsx",
      "utf8",
    );
    expect(source).toContain("lens.xMapUrl");
    expect(source).toContain("lens.yMapUrl");
    expect((source.match(/<feDisplacementMap/g) ?? []).length).toBeGreaterThanOrEqual(8);
  });

  it("presents Safari morph specular via double-buffered canvases", () => {
    const source = readFileSync(
      "registry/liquid-glass/compositions/glass-shell-backdrop.tsx",
      "utf8",
    );
    expect(source).toContain("cssBlurMorph");
    expect(source).toContain("presentCssBlurSpecular");
    expect(source).toContain("writeSpecularOverlay");
    expect(source).toContain("specCanvasARef");
    expect(source).toContain("specCanvasBRef");
    expect(source).toContain(
      "if (!useSvgRef.current && morphingRef.current) {\n        scheduleBake(w, h, rad)",
    );
  });

  it("keeps segmented items free of hover fill", () => {
    const source = readFileSync(
      "registry/liquid-glass/compositions/liquid-glass-compositions.css",
      "utf8",
    );
    expect(source).toContain(
      ".site-hover-fill:hover:not(.glass-segmented-item)",
    );
    expect(source).not.toContain("--glass-segmented-hover-fill");
    expect(source).not.toMatch(
      /\.glass-segmented-item:hover[\s\S]*background-color/,
    );
  });
});
