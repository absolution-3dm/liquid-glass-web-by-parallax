import { describe, expect, it } from "vitest";
import {
  createGlassMaterialDrafts,
  replaceGlassMaterialDraft,
  restoreGlassMaterialDraft,
} from "./material-drafts";
import {
  getGlassMaterialSource,
  glassFillForMode,
  glassFillToSource,
  glassMaterialParamsEqual,
  normalizeGlassMaterialOverrides,
  normalizeGlassMaterialParams,
  resolveGlassMaterial,
  type GlassMaterialParams,
} from "./materials";

describe("glass material presets", () => {
  it("resolves every physical preset from the versioned registry", () => {
    expect(resolveGlassMaterial("ultraThin")).toMatchObject({
      scale: 0.3,
      depth: 5,
      chroma: 0,
      blur: 0.5,
      glow: 0.03,
      edgeHighlight: 1,
      specular: 2.75,
      tint: 0.06,
    });
    expect(resolveGlassMaterial("thin")).toMatchObject({
      scale: 0.635,
      depth: 10,
      blur: 1,
      tint: 0.1,
    });
    expect(resolveGlassMaterial("regular")).toMatchObject({
      scale: 0.775,
      depth: 16,
      blur: 2,
      tint: 0.14,
    });
    expect(resolveGlassMaterial("thick")).toMatchObject({
      scale: 1,
      depth: 22,
      blur: 2,
      tint: 0.24,
    });
    expect(resolveGlassMaterial("ultraThick")).toMatchObject({
      scale: 1.17,
      depth: 30,
      blur: 2.5,
      tint: 0.38,
    });
  });

  it("inherits semantic recipes from their physical base", () => {
    const navigation = resolveGlassMaterial("navigation");
    const control = resolveGlassMaterial("control");
    const panel = resolveGlassMaterial("panel");

    expect(navigation).toMatchObject({
      curvature: 1,
      splay: 1,
      chroma: 0,
      blur: 1.5,
      scale: 1.465,
      depth: 20,
      edgeHighlight: 1,
      tint: 0.5,
      fill: "#080808",
    });
    expect(control).toMatchObject({
      curvature: 1,
      splay: 1,
      chroma: 0,
      blur: 1,
      scale: 1.1,
      depth: 20,
      edgeHighlight: 1,
      tint: 0.5,
      fill: "#080808",
    });
    expect(panel).toMatchObject({
      curvature: 1,
      splay: 1,
      chroma: 0,
      // panel does not override blur — inherits regular
      blur: 2,
      scale: 1.17,
      depth: 30,
      edgeHighlight: 1,
      tint: 0.56,
      fill: "#080808",
    });
    expect(resolveGlassMaterial("selectionPressed")).toMatchObject({
      curvature: 1,
      scale: 0.3,
      depth: 2,
      splay: 0.9,
      chroma: 0,
      blur: 0,
      tint: 0.06,
      fill: "#f4f7ff",
    });
  });
});

describe("glass material modes and overrides", () => {
  it("derives light values from the dark base with the shared transform", () => {
    const light = resolveGlassMaterial("regular", "light");

    expect(light.fill).toBe("#e0e0e0");
    expect(light.tint).toBeCloseTo(0.117);
    expect(light.blur).toBeCloseTo(2.3);
    expect(light.chroma).toBeCloseTo(0);
    expect(light.glow).toBeCloseTo(0.0225);
    expect(light.edgeHighlight).toBeCloseTo(0.85);
    expect(light.specular).toBeCloseTo(2.2);
    expect(light.scale).toBe(0.775);
    expect(light.depth).toBe(16);
    expect(light.specularAngle).toBe(37);
  });

  it("applies call-site overrides after the light transform", () => {
    const material = resolveGlassMaterial(
      { preset: "thin", tint: 0.18, fill: "#dce8ff" },
      "light",
    );

    expect(material.tint).toBe(0.18);
    expect(material.fill).toBe("#dce8ff");
    expect(material.blur).toBeCloseTo(1.15);
    expect(material.scale).toBe(0.635);
  });

  it("round-trips mode fill colors through the shared light transform", () => {
    const source = "#000000";
    const light = glassFillForMode(source, "light");
    expect(light).toBe("#e0e0e0");
    expect(glassFillToSource(light, "light")).toBe(source);
    expect(glassFillForMode(source, "dark")).toBe(source);
    expect(glassFillToSource("#aabbcc", "dark")).toBe("#aabbcc");
  });

  it("uses regular as the base for an override-only object", () => {
    expect(resolveGlassMaterial({ tint: 0.25 })).toEqual({
      ...resolveGlassMaterial("regular"),
      tint: 0.25,
    });
  });
});

describe("glass material validation", () => {
  it("keeps recommended slider maxima editable while enforcing hard bounds", () => {
    const regular = resolveGlassMaterial("regular");
    const normalized = normalizeGlassMaterialParams({
      ...regular,
      scale: 999,
      tint: -1,
      specularAngle: -45,
      fill: "#AAbbCC",
    });

    expect(normalized.scale).toBe(999);
    expect(normalized.tint).toBe(0);
    expect(normalized.specularAngle).toBe(315);
    expect(normalized.fill).toBe("#aabbcc");
  });

  it("rejects unknown names, keys, non-finite values and malformed colors", () => {
    expect(() => resolveGlassMaterial("unknown" as never)).toThrow(
      'Unknown glass material preset "unknown"',
    );
    expect(() =>
      normalizeGlassMaterialOverrides({ mystery: 1 }),
    ).toThrow('Unknown glass material parameter "mystery"');
    expect(() =>
      normalizeGlassMaterialParams({
        ...resolveGlassMaterial("regular"),
        blur: Number.NaN,
      }),
    ).toThrow('Glass material "blur" must be a finite number');
    expect(() =>
      normalizeGlassMaterialParams({
        ...resolveGlassMaterial("regular"),
        fill: "white",
      }),
    ).toThrow('Glass material "fill" must use #RRGGBB');
  });

  it("returns immutable, independent resolved objects", () => {
    const first = resolveGlassMaterial("regular");
    const second = resolveGlassMaterial("regular");

    expect(Object.isFrozen(first)).toBe(true);
    expect(Object.isFrozen(second)).toBe(true);
    expect(first).not.toBe(second);
    expect(() => {
      (first as GlassMaterialParams).tint = 0.9;
    }).toThrow();
    expect(second.tint).toBe(0.14);
  });
});

describe("Material Lab drafts", () => {
  it("keeps edits isolated per preset", () => {
    const drafts = createGlassMaterialDrafts();
    const next = replaceGlassMaterialDraft(drafts, "thin", {
      ...drafts.thin,
      tint: 0.33,
    });

    expect(next.thin.tint).toBe(0.33);
    expect(next.regular).toBe(drafts.regular);
    expect(next.navigation).toBe(drafts.navigation);
    expect(drafts.thin.tint).toBe(0.1);
  });

  it("restores only the selected preset", () => {
    const saved = createGlassMaterialDrafts();
    let drafts = replaceGlassMaterialDraft(saved, "thin", {
      ...saved.thin,
      tint: 0.33,
    });
    drafts = replaceGlassMaterialDraft(drafts, "regular", {
      ...saved.regular,
      tint: 0.44,
    });
    drafts = restoreGlassMaterialDraft(drafts, saved, "thin");

    expect(glassMaterialParamsEqual(drafts.thin, getGlassMaterialSource("thin"))).toBe(
      true,
    );
    expect(drafts.regular.tint).toBe(0.44);
  });
});
