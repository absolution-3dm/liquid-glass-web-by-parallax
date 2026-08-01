import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { resolveGlassMaterial } from "../registry/liquid-glass/materials/materials";

const root = resolve(import.meta.dirname, "..");

describe("LiquidGlass extraction contract", () => {
  it("preserves the current source navigation tuning", () => {
    expect(resolveGlassMaterial("navigation")).toMatchObject({
      scale: 1.465,
      depth: 20,
      blur: 1.5,
      specular: 3,
      tint: 0.5,
      fill: "#080808",
    });
  });

  it("keeps independent axis textures and both sequential pass orders", () => {
    const source = readFileSync(
      resolve(root, "registry/liquid-glass/liquid-glass.tsx"),
      "utf8",
    );

    expect(source).toContain('result="rawXDisplacementMap"');
    expect(source).toContain('result="rawYDisplacementMap"');
    expect(source).toContain('intercept="0.5"');
    expect(source).toContain('result="dispTopBottomY"');
    expect(source).toContain('in="dispTopBottomY"');
    expect(source).toContain('result="dispSidesX"');
    expect(source).toContain('in="dispSidesX"');
    expect(source).toContain("observeNearViewport");
  });

  it("keeps the standard CSS blur fallback and has no app coupling", () => {
    const runtimeFiles = [
      "registry/liquid-glass/liquid-glass.tsx",
      "registry/liquid-glass/liquid-glass.css",
      "registry/liquid-glass/browser-support.ts",
      "registry/liquid-glass/viewport-visibility.ts",
      "registry/liquid-glass/refraction/lens-map.ts",
      "registry/liquid-glass/refraction/math.ts",
      "registry/liquid-glass/refraction/engine.ts",
      "registry/liquid-glass/materials/materials.ts",
    ].map((file) => readFileSync(resolve(root, file), "utf8"));

    expect(runtimeFiles[1]).toContain(
      ".glass-surface--backdrop-blur .glass-surface__backdrop",
    );
    expect(runtimeFiles.join("\n")).not.toMatch(/from ["']@\//);
    expect(runtimeFiles.join("\n")).not.toMatch(/from ["']next\//);
    expect(runtimeFiles.join("\n")).not.toMatch(/from ["'](?:framer-)?motion["']/);
    expect(runtimeFiles.join("\n")).not.toContain("portfolio/");
  });

  it("ships only source files through the registry item", () => {
    const registry = JSON.parse(
      readFileSync(resolve(root, "registry.json"), "utf8"),
    ) as { items: Array<{ dependencies?: string[]; files: Array<{ target: string }> }> };
    const item = registry.items[0];

    expect(item.dependencies).toBeUndefined();
    expect(item.files).toHaveLength(10);
    expect(item.files.every(({ target }) => target.startsWith("components/liquid-glass/"))).toBe(
      true,
    );
  });
});
