"use client";

import {
  useEffect,
  useState,
  type ComponentProps,
  type ReactNode,
} from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../components/ui/carousel";
import { cn } from "../lib/utils";
import { vercelImageSrcSet, vercelImageUrl } from "../lib/vercel-image";

const SHOWCASE_SCENE_SIZES = "(max-width: 640px) 90vw, 480px";

/** Keep the previous frame painted until the next scene is decoded. */
function ShowcaseScene({
  src,
  loading = "lazy",
}: {
  src: string;
  loading?: "lazy" | "eager";
}) {
  const [shown, setShown] = useState(src);

  useEffect(() => {
    if (src === shown) return;

    let cancelled = false;
    const probe = new Image();
    const srcSet = vercelImageSrcSet(src);
    probe.sizes = SHOWCASE_SCENE_SIZES;
    if (srcSet) probe.srcset = srcSet;
    const reveal = () => {
      if (!cancelled) setShown(src);
    };
    probe.onload = reveal;
    probe.onerror = reveal;
    probe.src = vercelImageUrl(src, 960);

    return () => {
      cancelled = true;
    };
  }, [src, shown]);

  return (
    <img
      className="showcase-card__scene"
      src={vercelImageUrl(shown, 960)}
      srcSet={vercelImageSrcSet(shown)}
      sizes={SHOWCASE_SCENE_SIZES}
      alt=""
      aria-hidden="true"
      loading={loading}
      decoding="async"
    />
  );
}

/** Default scene used behind showcase slides. */
export const SHOWCASE_CAROUSEL_BACKGROUND =
  "/images/Carousel Background/04-refraction.png";

type ShowcaseCarouselProps = {
  "aria-label": string;
  className?: string;
  /**
   * When false, slide stages ignore pointer events so horizontal pan is not
   * swallowed by interactive demos (Material Design uncontained browsing).
   */
  interactive?: boolean;
  children: ReactNode;
};

/**
 * Material Design–style uncontained carousel: equal-size items, edge overflow,
 * content padding, and free scroll with prev/next controls.
 */
export function ShowcaseCarousel({
  "aria-label": ariaLabel,
  className,
  interactive = true,
  children,
}: ShowcaseCarouselProps) {
  return (
    <Carousel
      className={cn(
        "showcase-carousel",
        interactive ? undefined : "showcase-carousel--noninteractive",
        className,
      )}
      opts={{ align: "start", containScroll: "trimSnaps", dragFree: true }}
      aria-label={ariaLabel}
    >
      <div className="showcase-carousel__controls">
        <CarouselPrevious className="showcase-carousel__button" />
        <CarouselNext className="showcase-carousel__button" />
      </div>
      <CarouselContent className="showcase-carousel__track -ml-2">
        {children}
      </CarouselContent>
    </Carousel>
  );
}

type ShowcaseCarouselItemProps = ComponentProps<typeof CarouselItem>;

export function ShowcaseCarouselItem({
  className,
  ...props
}: ShowcaseCarouselItemProps) {
  return (
    <CarouselItem className={cn("showcase-carousel__item pl-2", className)} {...props} />
  );
}

type ShowcaseCarouselCardProps = {
  /** Slide title shown at the top of the card. */
  title: string;
  /**
   * Card backdrop. Pass an image URL string, or a custom React node.
   * Defaults to the shared playground scene.
   */
  background?: string | ReactNode;
  /** Centered object rendered in the card stage. */
  children: ReactNode;
  className?: string;
  stageClassName?: string;
  /** Remount only the stage (demos), not the scene image. */
  stageKey?: string | number;
  loading?: "lazy" | "eager";
} & Omit<ComponentProps<"article">, "title" | "children">;

export function ShowcaseCarouselCard({
  title,
  background = SHOWCASE_CAROUSEL_BACKGROUND,
  children,
  className,
  stageClassName,
  stageKey,
  loading = "lazy",
  ...props
}: ShowcaseCarouselCardProps) {
  return (
    <article className={cn("showcase-card", className)} {...props}>
      {typeof background === "string" ? (
        <ShowcaseScene src={background} loading={loading} />
      ) : (
        background
      )}
      <div className="showcase-card__veil" aria-hidden="true" />
      <div className="showcase-card__copy">
        <h3>{title}</h3>
      </div>
      <div
        key={stageKey}
        className={cn("showcase-card__stage", stageClassName)}
      >
        {children}
      </div>
    </article>
  );
}
