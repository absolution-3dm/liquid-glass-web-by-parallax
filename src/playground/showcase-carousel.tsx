"use client";

import type { ComponentProps, ReactNode } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../components/ui/carousel";
import { cn } from "../lib/utils";
import { vercelImageSrcSet, vercelImageUrl } from "../lib/vercel-image";

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
} & Omit<ComponentProps<"article">, "title" | "children">;

export function ShowcaseCarouselCard({
  title,
  background = SHOWCASE_CAROUSEL_BACKGROUND,
  children,
  className,
  stageClassName,
  ...props
}: ShowcaseCarouselCardProps) {
  return (
    <article className={cn("showcase-card", className)} {...props}>
      {typeof background === "string" ? (
        <img
          className="showcase-card__scene"
          src={vercelImageUrl(background, 960)}
          srcSet={vercelImageSrcSet(background)}
          sizes="(max-width: 640px) 90vw, 480px"
          alt=""
          aria-hidden="true"
          loading="lazy"
          decoding="async"
        />
      ) : (
        background
      )}
      <div className="showcase-card__veil" aria-hidden="true" />
      <div className="showcase-card__copy">
        <h3>{title}</h3>
      </div>
      <div className={cn("showcase-card__stage", stageClassName)}>{children}</div>
    </article>
  );
}
