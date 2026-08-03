"use client";

import { useLayoutEffect, useState } from "react";
import { CodeBlock, RegistryAttachment } from "./code-block";

const usageExample = `import { LiquidGlass } from "@/components/liquid-glass/liquid-glass"

<LiquidGlass width={320} height={96} borderRadius={32} material="panel">
  Your content
</LiquidGlass>`;

const registryPackages = [
  {
    name: "liquid-glass",
    title: "Parallax Glass",
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

export function InstallationShowcase() {
  const [origin, setOrigin] = useState("http://localhost:5173");
  const [packageManager, setPackageManager] = useState<"pnpm" | "npm">("pnpm");

  useLayoutEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const registryInstallCommand = (file: string) =>
    packageManager === "pnpm"
      ? `pnpm dlx shadcn@latest add ${origin}/r/${file}`
      : `npx shadcn@latest add ${origin}/r/${file}`;
  const installCommand = registryInstallCommand("liquid-glass.json");

  return (
    <section className="component-section installation-section" id="installation">
      <div className="section-heading">
        <h2>Install</h2>
        <p>
          Install via the shadcn Registry. The CLI copies the source into your
          app — no private runtime package.
        </p>
      </div>

      <div className="installation-stack">
        <CodeBlock
          label="Terminal"
          code={installCommand}
          language="bash"
          headerControl={
            <div className="package-manager-switch" role="tablist" aria-label="Package manager">
              {(["pnpm", "npm"] as const).map((manager) => (
                <button
                  key={manager}
                  type="button"
                  role="tab"
                  aria-selected={packageManager === manager}
                  className={packageManager === manager ? "is-active" : ""}
                  onClick={() => setPackageManager(manager)}
                >
                  {manager}
                </button>
              ))}
            </div>
          }
        />
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
                command={registryInstallCommand(item.file)}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
