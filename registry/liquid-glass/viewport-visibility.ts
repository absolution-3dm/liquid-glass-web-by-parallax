/**
 * Viewport gating for live glass backdrops.
 *
 * Chromium re-evaluates `backdrop-filter: url(#svg)` whenever sampled content
 * changes (e.g. an animating page background). Off-screen instances still pay
 * that cost unless the filter is detached. Observe near-viewport visibility and
 * only keep the live backdrop active while the surface is close enough to see.
 */

export const GLASS_VIEWPORT_ROOT_MARGIN_PX = 200;
export const GLASS_VIEWPORT_ROOT_MARGIN = `${GLASS_VIEWPORT_ROOT_MARGIN_PX}px`;

export function isElementNearViewport(
  el: Element,
  marginPx: number = GLASS_VIEWPORT_ROOT_MARGIN_PX,
  viewport: { width: number; height: number } = {
    width: typeof window !== "undefined" ? window.innerWidth : 0,
    height: typeof window !== "undefined" ? window.innerHeight : 0,
  },
): boolean {
  const rect = el.getBoundingClientRect();
  return (
    rect.bottom >= -marginPx &&
    rect.top <= viewport.height + marginPx &&
    rect.right >= -marginPx &&
    rect.left <= viewport.width + marginPx
  );
}

export function observeNearViewport(
  el: Element,
  onChange: (near: boolean) => void,
  rootMargin: string = GLASS_VIEWPORT_ROOT_MARGIN,
): () => void {
  onChange(isElementNearViewport(el));

  if (typeof IntersectionObserver === "undefined") {
    onChange(true);
    return () => {};
  }

  const io = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (!entry) return;
      onChange(entry.isIntersecting);
    },
    { root: null, rootMargin, threshold: 0 },
  );
  io.observe(el);
  return () => io.disconnect();
}
