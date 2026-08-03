export const topNavigationItems = [
  { value: "menu", label: "Home", href: "#menu" },
  { value: "customize", label: "Customize", href: "#customize" },
  { value: "components", label: "Components", href: "#components" },
  { value: "installation", label: "Installation", href: "#installation" },
];

/** Hero Get component CTA — cooler blue glass pill. */
export const heroCtaMaterial = {
  preset: "control" as const,
  fill: "#0b2f6b",
  tint: 0.82,
  blur: 1.25,
  specular: 3,
  chroma: 0.08,
};

/** Hero Customize CTA — neutral glass, no tint color. */
export const heroCustomizeMaterial = {
  preset: "control" as const,
  fill: "#080808",
  tint: 0.28,
  blur: 1.25,
  specular: 3,
  chroma: 0.08,
};
