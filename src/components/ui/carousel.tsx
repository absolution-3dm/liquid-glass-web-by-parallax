"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "../../lib/utils";
import { Button } from "./button";

type CarouselOptions = {
  align?: "start" | "center" | "end";
  containScroll?: "trimSnaps" | "keepSnaps" | false;
  dragFree?: boolean;
  loop?: boolean;
};

type CarouselPlugin = unknown[];

type CarouselApi = {
  canScrollNext: () => boolean;
  canScrollPrev: () => boolean;
  containerNode: () => HTMLDivElement | null;
  rootNode: () => HTMLDivElement | null;
  scrollNext: () => void;
  scrollPrev: () => void;
  slideNodes: () => HTMLElement[];
};

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
};

type CarouselContextProps = {
  carouselRef: (node: HTMLDivElement | null) => void;
  handleClickCapture: (event: React.MouseEvent<HTMLDivElement>) => void;
  handlePointerCancel: (event: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerDown: (event: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerMove: (event: React.PointerEvent<HTMLDivElement>) => void;
  handlePointerUp: (event: React.PointerEvent<HTMLDivElement>) => void;
  handleScroll: () => void;
  handleWheel: (event: React.WheelEvent<HTMLDivElement>) => void;
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

function Carousel({
  orientation = "horizontal",
  opts,
  setApi,
  plugins,
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & CarouselProps) {
  const rootRef = React.useRef<HTMLDivElement>(null);
  const viewportRef = React.useRef<HTMLDivElement | null>(null);
  const [viewport, setViewport] = React.useState<HTMLDivElement | null>(null);
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);
  const dragRef = React.useRef({
    active: false,
    didDrag: false,
    pointerId: -1,
    startPosition: 0,
    startScroll: 0,
  });
  const suppressClickRef = React.useRef(false);

  const carouselRef = React.useCallback((node: HTMLDivElement | null) => {
    viewportRef.current = node;
    setViewport(node);
  }, []);

  const updateScrollState = React.useCallback(() => {
    const node = viewportRef.current;
    if (!node) return;

    const position = orientation === "horizontal" ? node.scrollLeft : node.scrollTop;
    const maximum =
      orientation === "horizontal"
        ? node.scrollWidth - node.clientWidth
        : node.scrollHeight - node.clientHeight;

    setCanScrollPrev(position > 1);
    setCanScrollNext(position < maximum - 1);
  }, [orientation]);

  const getSlideNodes = React.useCallback(() => {
    const node = viewportRef.current;
    if (!node) return [];
    return Array.from(node.querySelectorAll<HTMLElement>("[data-slot='carousel-item']"));
  }, []);

  const scrollToAdjacentSlide = React.useCallback(
    (direction: -1 | 1) => {
      const node = viewportRef.current;
      const slides = getSlideNodes();
      if (!node || slides.length === 0) return;

      const horizontal = orientation === "horizontal";
      const firstOffset = horizontal ? slides[0].offsetLeft : slides[0].offsetTop;
      const offsets = slides.map((slide) =>
        (horizontal ? slide.offsetLeft : slide.offsetTop) - firstOffset,
      );
      const position = horizontal ? node.scrollLeft : node.scrollTop;
      const maximum = horizontal
        ? node.scrollWidth - node.clientWidth
        : node.scrollHeight - node.clientHeight;

      let target =
        direction > 0
          ? offsets.find((offset) => offset > position + 2) ?? maximum
          : [...offsets].reverse().find((offset) => offset < position - 2) ?? 0;

      // Last slide's offset can exceed max scroll once end spacers are included.
      if (direction > 0 && target >= offsets[offsets.length - 1] - 1) {
        target = maximum;
      }

      node.scrollTo({
        [horizontal ? "left" : "top"]: Math.max(0, Math.min(target, maximum)),
        behavior: "smooth",
      });
    },
    [getSlideNodes, orientation],
  );

  const scrollPrev = React.useCallback(
    () => scrollToAdjacentSlide(-1),
    [scrollToAdjacentSlide],
  );
  const scrollNext = React.useCallback(
    () => scrollToAdjacentSlide(1),
    [scrollToAdjacentSlide],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext],
  );

  const handleWheel = React.useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      const node = viewportRef.current;
      if (!node || orientation !== "horizontal" || !event.shiftKey) return;
      if (Math.abs(event.deltaX) >= Math.abs(event.deltaY) || Math.abs(event.deltaY) < 0.1) {
        return;
      }

      const deltaScale = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? node.clientWidth : 1;
      node.scrollLeft += event.deltaY * deltaScale;
      event.preventDefault();
    },
    [orientation],
  );

  const handlePointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      const target = event.target;
      if (
        target instanceof Element &&
        target.closest("a, button, input, select, textarea, [role='button'], [role='tab']")
      ) {
        return;
      }

      const node = viewportRef.current;
      if (!node) return;
      const horizontal = orientation === "horizontal";
      dragRef.current = {
        active: true,
        didDrag: false,
        pointerId: event.pointerId,
        startPosition: horizontal ? event.clientX : event.clientY,
        startScroll: horizontal ? node.scrollLeft : node.scrollTop,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    [orientation],
  );

  const handlePointerMove = React.useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      const node = viewportRef.current;
      if (!drag.active || drag.pointerId !== event.pointerId || !node) return;

      const horizontal = orientation === "horizontal";
      const position = horizontal ? event.clientX : event.clientY;
      const distance = position - drag.startPosition;
      if (Math.abs(distance) > 3) {
        drag.didDrag = true;
        event.preventDefault();
      }

      if (horizontal) node.scrollLeft = drag.startScroll - distance;
      else node.scrollTop = drag.startScroll - distance;
    },
    [orientation],
  );

  const finishPointerDrag = React.useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;
    suppressClickRef.current = drag.didDrag;
    drag.active = false;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  }, []);

  const handleClickCapture = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const api = React.useMemo<CarouselApi>(
    () => ({
      canScrollNext: () => {
        const node = viewportRef.current;
        if (!node) return false;
        return orientation === "horizontal"
          ? node.scrollLeft < node.scrollWidth - node.clientWidth - 1
          : node.scrollTop < node.scrollHeight - node.clientHeight - 1;
      },
      canScrollPrev: () => {
        const node = viewportRef.current;
        if (!node) return false;
        return orientation === "horizontal" ? node.scrollLeft > 1 : node.scrollTop > 1;
      },
      containerNode: () => viewportRef.current,
      rootNode: () => rootRef.current,
      scrollNext,
      scrollPrev,
      slideNodes: getSlideNodes,
    }),
    [getSlideNodes, orientation, scrollNext, scrollPrev],
  );

  React.useEffect(() => {
    if (!viewport) return;
    updateScrollState();
    const resizeObserver = new ResizeObserver(updateScrollState);
    resizeObserver.observe(viewport);
    const track = viewport.firstElementChild;
    if (track) resizeObserver.observe(track);
    return () => resizeObserver.disconnect();
  }, [updateScrollState, viewport]);

  React.useEffect(() => {
    if (setApi) setApi(api);
  }, [api, setApi]);

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        opts,
        orientation,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
        plugins,
        setApi,
        handleClickCapture,
        handlePointerCancel: finishPointerDrag,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp: finishPointerDrag,
        handleScroll: updateScrollState,
        handleWheel,
      }}
    >
      <div
        {...props}
        ref={rootRef}
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        data-can-scroll-previous={canScrollPrev || undefined}
        data-can-scroll-next={canScrollNext || undefined}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const {
    carouselRef,
    handleClickCapture,
    handlePointerCancel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    handleScroll,
    handleWheel,
    orientation,
  } = useCarousel();

  return (
    <div
      ref={carouselRef}
      className={cn(
        "overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        orientation === "horizontal"
          ? "overflow-x-auto overflow-y-hidden"
          : "overflow-x-hidden overflow-y-auto",
      )}
      data-slot="carousel-content"
      onClickCapture={handleClickCapture}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onScroll={handleScroll}
      onWheel={handleWheel}
    >
      <div
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useCarousel();

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className,
      )}
      {...props}
    />
  );
}

function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "top-1/2 -left-12 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ArrowLeft />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
}

function CarouselNext({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const { orientation, scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      className={cn(
        "absolute size-8 rounded-full",
        orientation === "horizontal"
          ? "top-1/2 -right-12 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        className,
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ArrowRight />
      <span className="sr-only">Next slide</span>
    </Button>
  );
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
};
