import {
  LiquidGlass,
  type GlassMaterialInput,
  type GlassMaterialName,
  type GlassMaterialParams,
} from "../registry/liquid-glass/liquid-glass";

type Comparison = {
  name: GlassMaterialName;
  dimensions: { width: number; height: number; borderRadius: number };
  sourceSnapshot: GlassMaterialParams;
};

const comparisons: Comparison[] = [
  {
    name: "regular",
    dimensions: { width: 260, height: 96, borderRadius: 30 },
    sourceSnapshot: {
      scale: 0.775,
      depth: 16,
      curvature: 1,
      splay: 1,
      chroma: 0,
      blur: 2,
      glow: 0.03,
      edgeHighlight: 1,
      specularAngle: 37,
      specular: 2.75,
      tint: 0.14,
      fill: "#000000",
    },
  },
  {
    name: "navigation",
    dimensions: { width: 260, height: 72, borderRadius: 28 },
    sourceSnapshot: {
      scale: 1.465,
      depth: 20,
      curvature: 1,
      splay: 1,
      chroma: 0,
      blur: 1.5,
      glow: 0.03,
      edgeHighlight: 1,
      specularAngle: 37,
      specular: 3,
      tint: 0.5,
      fill: "#080808",
    },
  },
];

function Sample({
  label,
  material,
  dimensions,
}: {
  label: string;
  material: GlassMaterialInput;
  dimensions: Comparison["dimensions"];
}) {
  return (
    <div className="sample">
      <span>{label}</span>
      <LiquidGlass {...dimensions} material={material}>
        <strong>Liquid Glass</strong>
      </LiquidGlass>
    </div>
  );
}

export function Playground() {
  return (
    <main>
      <header>
        <p>Source-owned shadcn primitive</p>
        <h1>LiquidGlass extraction parity</h1>
        <p>
          左侧使用抽取时记录的 source 显式参数，右侧使用 registry preset；
          每一对共享相同背景、尺寸与圆角。
        </p>
      </header>

      {comparisons.map(({ name, dimensions, sourceSnapshot }) => (
        <section key={name}>
          <h2>{name}</h2>
          <div className="comparison-grid">
            <Sample
              label="Source snapshot"
              material={sourceSnapshot}
              dimensions={dimensions}
            />
            <Sample
              label="Registry preset"
              material={name}
              dimensions={dimensions}
            />
          </div>
        </section>
      ))}
    </main>
  );
}
