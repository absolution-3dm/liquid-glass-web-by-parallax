"use client";

import {
  animate,
  motion,
  useMotionValue,
  useTransform,
} from "motion/react";
import type { MotionStyle, MotionValue } from "motion/react";
import type {
  CSSProperties,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from "react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import LiquidGlass from "../liquid-glass";
import type { GlassMaterialInput, GlassMaterialMode } from "../materials/materials";
import "./liquid-glass-compositions.css";

/**
 * Bridges Motion values into CSS custom properties for a `motion.*` `style`
 * prop. `MotionStyle` (from the `motion` package) only types known CSS
 * properties plus a handful of Motion-specific transform shorthands, so it
 * rejects arbitrary `--foo` keys even though Motion happily writes them to
 * the DOM at animation time. `T` pins down exactly which custom properties a
 * given usage sets (and whether their value is a plain number/string or a
 * live `MotionValue`), so the intersection stays type-safe without needing a
 * one-off inline cast at every call site.
 */
type MotionCssVars<T extends Record<`--${string}`, MotionValue<number> | number | string>> =
  MotionStyle & T;

export type GlassSegmentedItem = {
  value: string;
  label: ReactNode;
  /** Renders the item as an anchor. Plain click still resolves through `onValueChange`; modifier-clicks (cmd/ctrl/shift/alt) fall through to native link behavior. */
  href?: string;
  /** Extra DOM attributes spread onto the rendered item (e.g. data-* hooks for unrelated systems like a magnetic-hover cursor). */
  itemProps?: Record<string, string | number | boolean | undefined>;
};

export type GlassSegmentedControlProps = {
  items: GlassSegmentedItem[];
  /** Selected item's `value`. Controlled — the consumer owns selection state. */
  value: string;
  onValueChange: (value: string) => void;
  /** Resting width of one item, px. */
  itemWidth?: number;
  /** Resting height of one item, px. */
  itemHeight?: number;
  /** Inset between the pill edge and its items, px. */
  padding?: number;
  /** How far the pressed/dragged chip grows beyond its resting footprint, px. */
  radialExpansion?: number;
  /** Material for the pill shell and the resting selection fill. */
  material?: GlassMaterialInput;
  /** Material for the enlarged chip while pressed/dragged. */
  pressedMaterial?: GlassMaterialInput;
  materialMode?: GlassMaterialMode;
  /** Force the real pressed-glass layer on for stories and visual regression captures. */
  pressedPreview?: boolean;
  className?: string;
  itemClassName?: string;
  style?: CSSProperties;
};

// Governs chipX (horizontal position) whenever it's *not* under direct
// pointer control: releasing a drag onto a new/same item, or an external
// `value` change moving the chip programmatically. Softer than the press
// spring so the settle reads as "gliding to rest" rather than "snapping".
const CHIP_SNAP_SPRING = { type: "spring", stiffness: 320, damping: 32, mass: 0.9 } as const;
// Governs chipPress (0→1 "how popped-out is the glass" amount) on press/release.
// Stiffer and lighter than the snap spring so the glass visibly pops the
// instant a finger/cursor lands, rather than lagging behind the position change.
const CHIP_PRESS_SPRING = { type: "spring", stiffness: 500, damping: 38, mass: 0.65 } as const;
// Click-to-switch (as opposed to drag-to-switch) doesn't use a spring — it's a
// single fixed-duration timeline so the position glide and the glass
// pop-then-fade (see switchToIndex's `times` array) stay in lockstep instead
// of drifting apart if a spring under- or over-shoots.
const CHIP_SWITCH_DURATION = 0.68;
const CHIP_SWITCH_EASE = [0.16, 0.84, 0.18, 1] as const;
// A press+release with less movement than this counts as "just a tap": the
// resulting click is allowed through instead of being swallowed as a drag.
const CHIP_DRAG_CLICK_CANCEL_PX = 4;

/**
 * Liquid-glass segmented control (Aave-style tab pill). The selected chip can
 * be grabbed and dragged between items — with mouse, touch, or pen — and
 * releasing snaps to the nearest one; its fixed-size glass grows from the
 * resting footprint into a full refracted surface while held.
 *
 * Controlled only: pass `value`/`onValueChange`, same shape as Radix `Tabs`.
 * This component owns geometry, drag physics, and glass material only — it
 * has no opinion on what selecting an item *does* (scroll, route, filter…),
 * that lives entirely in `onValueChange`.
 */
export function GlassSegmentedControl({
  items,
  value,
  onValueChange,
  itemWidth = 76,
  itemHeight = 40,
  padding = 4,
  radialExpansion = 8,
  material = "navigation",
  pressedMaterial = "selectionPressed",
  materialMode = "dark",
  pressedPreview = false,
  className = "",
  itemClassName = "",
  style,
}: GlassSegmentedControlProps) {
  const width = items.length * itemWidth + padding * 2;
  const height = itemHeight + padding * 2;
  const chipFinalWidth = itemWidth + radialExpansion * 2;
  const chipFinalHeight = itemHeight + radialExpansion * 2;
  const chipFinalRadius = chipFinalHeight / 2;

  const rawActiveIndex = items.findIndex((item) => item.value === value);
  if (process.env.NODE_ENV !== "production" && rawActiveIndex === -1) {
    console.warn(
      `GlassSegmentedControl: value "${value}" does not match any item's value; falling back to index 0.`,
    );
  }
  const activeIndex = Math.max(0, rawActiveIndex);

  // The resting fill tracks its snap position via this state; the separate
  // pressed/dragged layer owns its own live dimensions so its SVG map can be
  // rebuilt from the actual animated box (see GlassSurface's ResizeObserver).
  const [pillX, setPillX] = useState(padding);
  const navRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<Array<HTMLElement | null>>([]);

  const chipX = useMotionValue<number>(padding);
  const chipPress = useMotionValue(0); // eased 0→1 press amount (pop while held)
  const chipWidth = useTransform(chipPress, [0, 1], [itemWidth, chipFinalWidth]);
  const chipHeight = useTransform(chipPress, [0, 1], [itemHeight, chipFinalHeight]);
  const chipTop = useTransform(chipPress, [0, 1], [padding, padding - radialExpansion]);
  const chipVisualX = useTransform(() => chipX.get() - radialExpansion * chipPress.get());
  const restingFillOpacity = useTransform(chipPress, [0, 0.35, 1], [1, 0.35, 0]);
  const dragGlassOpacity = useTransform(chipPress, [0, 0.25, 1], [0, 0.85, 1]);
  const dragGlassSaturation = useTransform(dragGlassOpacity, [0, 1], [1, 1.4]);
  const chipShadow = useTransform(
    chipPress,
    [0, 1],
    [
      "0px 0px 0px rgba(0, 0, 0, 0), 0px 0px 0px rgba(0, 0, 0, 0)",
      "0px 10px 24px rgba(0, 0, 0, 0.16), 0px 2px 6px rgba(0, 0, 0, 0.1)",
    ],
  );

  // Story/visual-regression state only. This drives the same MotionValue as a
  // real pointer press, so the enlarged surface, refraction progress, tint,
  // saturation, shadow and resting-fill fade stay on the production path.
  useLayoutEffect(() => {
    if (!pressedPreview) return;
    chipPress.set(1);
    return () => chipPress.set(0);
  }, [chipPress, pressedPreview]);

  // x-offset of each item's left edge relative to the nav, in snap order.
  // Seeded with the ideal evenly-spaced layout so the very first paint (before
  // `measure()` can run) isn't at x=0; corrected to real measured positions
  // by the layout effect below before the user can interact.
  const snapsRef = useRef<number[]>(items.map((_, index) => padding + index * itemWidth));
  // Mirrors `activeIndex` into a ref so pointer/animation callbacks (which are
  // memoized once and read "the current active index" long after they were
  // created) always see the latest value instead of a stale render's closure.
  const activeIndexRef = useRef(activeIndex);
  // True only while a pointer-drag owns chipX; guards the selection-driven
  // spring effect below from fighting the user's own drag.
  const draggingRef = useRef(false);
  // Live state for the in-progress drag gesture, or null when idle.
  // `pointerId` pins this drag to the specific finger/cursor that started it —
  // required once touch is allowed, since a second finger touching the chip
  // would otherwise generate pointermove/pointerup events indistinguishable
  // from the first at the window-listener level.
  const dragRef = useRef<{
    pointerId: number;
    pointerX: number;
    baseX: number;
    moved: number;
  } | null>(null);
  // Aborts the window-level pointermove/pointerup/pointercancel listeners for
  // whichever drag is currently in flight (used both on a clean drag end and
  // as a safety net if a new pointerdown or an unmount interrupts one).
  const dragAbortRef = useRef<AbortController | null>(null);
  // Set when a drag traveled far enough to *not* count as a tap; the very
  // next click event on the item is swallowed once, then this resets.
  const suppressClickRef = useRef(false);
  // True only while `switchToIndex`'s click-driven timeline is running;
  // suppresses the selection-driven spring effect the same way `draggingRef`
  // does, so a click mid-animation doesn't get fought by two timelines at once.
  const switchingRef = useRef(false);
  // Incremented on every switchToIndex call so an in-flight (awaited) call
  // that gets superseded by a newer one knows not to clear `switchingRef`
  // out from under the newer call once its own animation resolves.
  const switchEpochRef = useRef(0);

  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Plain linear scan — snaps.length is the item count (a handful at most for
  // any realistic segmented control), so this is cheaper than it looks and
  // not worth a binary search over a pre-sorted copy.
  const nearestSnapIndex = useCallback((x: number) => {
    const snaps = snapsRef.current;
    let best = 0;
    let bestDist = Infinity;
    snaps.forEach((snap, index) => {
      const dist = Math.abs(snap - x);
      if (dist < bestDist) {
        bestDist = dist;
        best = index;
      }
    });
    return best;
  }, []);

  // Single measurement pass: refreshes both the drag-snap positions and the
  // resting pill's target (one DOM read instead of two separate ones).
  const measure = useCallback(() => {
    const nav = navRef.current;
    if (!nav) return;
    itemRefs.current.length = items.length;
    const navLeft = nav.getBoundingClientRect().left;
    const lefts = itemRefs.current.map((el) =>
      el ? el.getBoundingClientRect().left - navLeft : null,
    );
    if (!lefts.every((x): x is number => x !== null)) return;
    snapsRef.current = lefts;
    const activeLeft = lefts[activeIndex];
    if (activeLeft !== undefined) setPillX(activeLeft);
  }, [items.length, activeIndex]);

  // Press-drag of the active chip. Handlers are stable and read the latest
  // active index / snaps via refs so add/removeEventListener pair up cleanly.
  // Mouse, touch, and pen all funnel through the same Pointer Events path;
  // the `pointerId` check ignores any *other* pointer's move/end events (e.g.
  // a second finger touching the chip mid-drag) so only the pointer that
  // actually started the gesture can move or end it.
  const handleDragMove = useCallback(
    (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      // Belt-and-suspenders alongside `touch-action: none` below: some mobile
      // engines have, at times, re-evaluated touch-action against whatever
      // element currently sits under the finger rather than pinning it to the
      // touch-start target for the gesture's whole duration (spec says the
      // latter). Explicitly preventing default here means even if that
      // happens once the finger has wandered outside the pill's box, the
      // browser still can't reinterpret the rest of the gesture as a native
      // scroll and cancel our drag out from under the user.
      event.preventDefault();
      const dx = event.clientX - drag.pointerX;
      drag.moved = Math.max(drag.moved, Math.abs(dx));
      const snaps = snapsRef.current;
      const lo = Math.min(...snaps);
      const hi = Math.max(...snaps);
      const raw = drag.baseX + dx;
      const clamped = Math.max(lo, Math.min(hi, raw));
      // Rubber past the ends so it feels elastic — but truly bounded: tanh
      // matches the linear 0.12 give right at the edge (tanh(x) ≈ x for
      // small x) while asymptoting to ±radialExpansion however far the
      // pointer keeps going, instead of growing without bound.
      const overshoot = raw - clamped;
      const bounded =
        radialExpansion * Math.tanh((overshoot * 0.12) / radialExpansion);
      chipX.set(clamped + bounded);
    },
    [chipX, radialExpansion],
  );

  // Shared by pointerup (deliberate release) and pointercancel (the OS/browser
  // yanks the gesture away — e.g. an incoming call, or the browser deciding a
  // touch was actually a scroll after all). Both must land the chip on a snap
  // point rather than leaving it stranded mid-drag.
  const handleDragEnd = useCallback(
    (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag || event.pointerId !== drag.pointerId) return;
      dragAbortRef.current?.abort();
      dragAbortRef.current = null;
      dragRef.current = null;
      draggingRef.current = false;
      animate(chipPress, 0, CHIP_SNAP_SPRING);
      if (drag.moved > CHIP_DRAG_CLICK_CANCEL_PX) suppressClickRef.current = true;

      const targetIndex = nearestSnapIndex(chipX.get());
      if (targetIndex !== activeIndexRef.current) {
        onValueChange(items[targetIndex].value);
      } else {
        animate(chipX, snapsRef.current[activeIndexRef.current], CHIP_SNAP_SPRING);
      }
    },
    [chipX, chipPress, items, nearestSnapIndex, onValueChange],
  );

  // Click switching shares one overlapping timeline: movement and the glass
  // ramp start together, then the glass fades back during the final portion
  // of the same inertial glide.
  const switchToIndex = useCallback(
    async (index: number) => {
      const epoch = ++switchEpochRef.current;
      switchingRef.current = true;
      measure();

      onValueChange(items[index].value);
      const movement = animate(chipX, snapsRef.current[index], {
        duration: CHIP_SWITCH_DURATION,
        ease: CHIP_SWITCH_EASE,
      });
      const material = animate(chipPress, [chipPress.get(), 1, 1, 0], {
        duration: CHIP_SWITCH_DURATION,
        times: [0, 0.24, 0.62, 1],
        ease: "easeInOut",
      });

      await Promise.all([movement, material]);
      if (epoch === switchEpochRef.current) switchingRef.current = false;
    },
    [chipPress, chipX, items, measure, onValueChange],
  );

  const handleChipPointerDown = useCallback(
    (index: number) => (event: ReactPointerEvent<HTMLElement>) => {
      // Only the selected item's fill is draggable; other taps just select.
      // `button !== 0` still filters out e.g. a right-click drag with the
      // mouse; touch/pen report button 0 on contact, so this one check works
      // uniformly across all pointer types — no separate mouse/touch branch.
      if (event.button !== 0) return;
      if (index !== activeIndexRef.current) return;
      measure();
      draggingRef.current = true;
      dragRef.current = {
        pointerId: event.pointerId,
        pointerX: event.clientX,
        baseX: chipX.get(),
        moved: 0,
      };
      // Route all subsequent events for this gesture to the item itself
      // (rather than whatever the finger/cursor happens to be over) so a
      // touch drifting off the small item's hit box mid-drag doesn't drop it.
      event.currentTarget.setPointerCapture(event.pointerId);
      animate(chipPress, 1, CHIP_PRESS_SPRING);
      dragAbortRef.current?.abort();
      const ac = new AbortController();
      dragAbortRef.current = ac;
      window.addEventListener("pointermove", handleDragMove, { signal: ac.signal });
      window.addEventListener("pointerup", handleDragEnd, { signal: ac.signal });
      window.addEventListener("pointercancel", handleDragEnd, { signal: ac.signal });
    },
    [chipX, chipPress, handleDragEnd, handleDragMove, measure],
  );

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  // Spring the chip to the resting item whenever selection/layout changes —
  // unless a drag currently owns it. This is the click/external-select glide.
  // (snapsRef/pillX are already fresh by the time this runs: the layout
  // effect above measures synchronously earlier in the same commit.)
  useEffect(() => {
    if (draggingRef.current || switchingRef.current) return;
    const controls = animate(chipX, pillX, CHIP_SNAP_SPRING);
    return () => controls.stop();
  }, [pillX, chipX]);

  useEffect(() => {
    let cancelled = false;
    if (typeof document !== "undefined" && document.fonts) {
      document.fonts.ready.then(() => {
        if (!cancelled) measure();
      });
    }
    const rafId = requestAnimationFrame(() => {
      measure();
    });
    window.addEventListener("resize", measure);
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  // Drop drag listeners if we unmount mid-drag.
  useEffect(() => () => dragAbortRef.current?.abort(), []);

  // iOS Safari can still start a text selection (word-select highlight, then
  // the selection-menu callout) from rapid repeated taps even though every
  // item already has `user-select: none` — that CSS is supposed to be
  // sufficient but isn't reliably honored by Safari for this specific
  // fast-tap-repetition gesture. `selectstart` fires right as the selection
  // is about to begin, so suppressing it here is the last line of defense
  // once the CSS property alone doesn't hold.
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const preventSelectStart = (event: Event) => event.preventDefault();
    nav.addEventListener("selectstart", preventSelectStart);
    return () => nav.removeEventListener("selectstart", preventSelectStart);
  }, []);

  return (
    <LiquidGlass
      width={width}
      height={height}
      borderRadius={height / 2}
      material={material}
      materialMode={materialMode}
      className={`glass-pill-surface glass-segmented-surface ${className}`.trim()}
      stateLayer={
        <motion.span
          className="glass-state-chip"
          style={{ width: itemWidth, x: chipX }}
        >
          <motion.span
            className="glass-state-chip__fill"
            style={{ opacity: restingFillOpacity }}
          />
        </motion.span>
      }
      overlayLayer={
        <motion.span
          className="glass-state-chip"
          style={{
            width: chipWidth,
            height: chipHeight,
            top: chipTop,
            x: chipVisualX,
            boxShadow: chipShadow,
          }}
        >
          <motion.span
            className="glass-segmented-drag-glass"
            style={
              {
                "--glass-segmented-drag-progress": dragGlassOpacity,
                "--glass-segmented-drag-saturation": dragGlassSaturation,
              } as MotionCssVars<{
                "--glass-segmented-drag-progress": typeof dragGlassOpacity;
                "--glass-segmented-drag-saturation": typeof dragGlassSaturation;
              }>
            }
          >
            <LiquidGlass
              width="100%"
              height="100%"
              borderRadius={chipFinalRadius}
              refractionProgress={chipPress}
              material={pressedMaterial}
              materialMode={materialMode}
              className="glass-segmented-drag-surface"
            />
          </motion.span>
        </motion.span>
      }
      style={style}
    >
      <nav
        ref={navRef}
        role="tablist"
        className="relative flex h-full w-full items-center rounded-full p-1"
        // Matches each item's own `touch-action: none` (see below) across the
        // whole pill, not just the pressed item's small hit box: dragging the
        // chip between items means the finger travels over its *neighbors*
        // too, and a fast real-world swipe can easily carry it past the
        // pill's edges altogether. Keeping the used touch-action uniform
        // (and maximally restrictive) over that entire area is what stops
        // some mobile engines from reconsidering the gesture as a native
        // scroll partway through and cancelling the drag.
        //
        // `userSelect: "none"` similarly covers the small gaps between items
        // (the nav's own padding/flex gutters) — each item already blocks
        // selection on itself via the `select-none` Tailwind class, but a
        // fast tap landing a few px off-target, right on the bare nav
        // background, wasn't otherwise covered by that per-item rule.
        style={{ touchAction: "none", userSelect: "none", WebkitUserSelect: "none" } as CSSProperties}
      >
        {items.map((item, index) => {
          const isActive = index === activeIndex;
          const commonProps = {
            ref: (node: HTMLElement | null) => {
              itemRefs.current[index] = node;
            },
            onPointerDown: handleChipPointerDown(index),
            // A long-press-and-hold is exactly how a touch drag starts, which
            // is indistinguishable (to the browser) from a long-press asking
            // for the native link/selection context menu. Swallowing
            // `contextmenu` stops that menu from popping up mid-drag — on
            // Android Chrome this is the actual mechanism that shows it; on
            // iOS Safari the callout below (a separate, non-event-based
            // mechanism) is what needs suppressing instead.
            onContextMenu: (event: { preventDefault: () => void }) => {
              event.preventDefault();
            },
            role: "tab" as const,
            "aria-selected": isActive,
            className:
              `site-hover-fill glass-segmented-item relative z-10 flex items-center justify-center rounded-full text-sm font-medium select-none [-webkit-tap-highlight-color:transparent] ${itemClassName}`.trim(),
            style: {
              width: itemWidth,
              height: itemHeight,
              // `none`, not the Tailwind `touch-manipulation` default: a touch
              // landing on the active item can turn into a chip drag, and
              // once it does we want zero native gesture handling (including
              // vertical scroll) competing for it — same reasoning as the
              // `<nav>`'s `touch-action` above. The cost (you can't start a
              // page-scroll gesture with a finger that happens to land on
              // this small control) is the same trade-off every native
              // slider/segmented control makes.
              touchAction: "none",
              // iOS Safari's long-press "peek" preview + share-sheet callout
              // on `<a>` fires independently of any JS event, purely from
              // this CSS property — `preventDefault`-ing `contextmenu` above
              // has no effect on it, so it needs its own opt-out.
              WebkitTouchCallout: "none",
            } as CSSProperties,
          };

          const onSelect = (event: { preventDefault: () => void }) => {
            if (suppressClickRef.current) {
              suppressClickRef.current = false;
              event.preventDefault();
              return;
            }
            if (index === activeIndexRef.current) {
              onValueChange(item.value);
            } else {
              void switchToIndex(index);
            }
          };

          if (item.href) {
            return (
              <a
                key={item.value}
                {...item.itemProps}
                {...commonProps}
                href={item.href}
                // Suppress the browser's native HTML5 drag-and-drop of the
                // link itself (its own separate mechanism from our pointer
                // drag) so grabbing the chip never turns into dragging a URL.
                draggable={false}
                onClick={(event) => {
                  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                    return;
                  }
                  event.preventDefault();
                  onSelect(event);
                }}
              >
                {item.label}
              </a>
            );
          }

          return (
            <button
              key={item.value}
              {...item.itemProps}
              {...commonProps}
              type="button"
              onClick={(event) => onSelect(event)}
            >
              {item.label}
            </button>
          );
        })}
      </nav>
    </LiquidGlass>
  );
}
