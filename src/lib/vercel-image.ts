/** Widths allowed by `vercel.json` → `images.sizes`. */
export const VERCEL_IMAGE_WIDTHS = [480, 640, 960, 1280] as const;

const DEFAULT_QUALITY = 75;

/**
 * Vercel Image Optimization URL for non-Next frameworks.
 * @see https://vercel.com/docs/image-optimization
 */
export function vercelImageUrl(
  src: string,
  width: number,
  quality = DEFAULT_QUALITY,
): string {
  if (import.meta.env.DEV) return src;
  return `/_vercel/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality}`;
}

/** Responsive `srcSet` for `/_vercel/image` (undefined in local `vite` so assets load as-is). */
export function vercelImageSrcSet(
  src: string,
  widths: readonly number[] = VERCEL_IMAGE_WIDTHS,
  quality = DEFAULT_QUALITY,
): string | undefined {
  if (import.meta.env.DEV) return undefined;
  return [...widths]
    .sort((a, b) => a - b)
    .map((width) => `${vercelImageUrl(src, width, quality)} ${width}w`)
    .join(", ");
}

/** Warm the browser / CDN cache for a scene used by display-size `srcset`. */
export function preloadVercelImage(
  src: string,
  width = 960,
  sizes = "(max-width: 640px) 90vw, 480px",
) {
  const img = new Image();
  const srcSet = vercelImageSrcSet(src);
  img.sizes = sizes;
  if (srcSet) img.srcset = srcSet;
  img.src = vercelImageUrl(src, width);
}
