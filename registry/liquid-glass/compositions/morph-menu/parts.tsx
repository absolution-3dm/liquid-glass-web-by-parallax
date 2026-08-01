"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { CSSProperties, PointerEvent as ReactPointerEvent, ReactNode } from "react";
import { useMorphMenu } from "./context";

type OverlayProps = {
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
};

export function Overlay({ className = "", style, onClick }: OverlayProps) {
  const { open, setOpen, visualDuration, bounce } = useMorphMenu();
  const reduced = useReducedMotion();
  const transition = reduced
    ? { type: "spring" as const, stiffness: 1000, damping: 100 }
    : { type: "spring" as const, visualDuration, bounce };

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="morph-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={transition}
          className={className}
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            left: 0,
            // Keep clear of Safari's bottom "chin" sampling zone (iOS 26+):
            // a full-bleed fixed layer there retints the toolbar and hides
            // page content that was visible through the liquid-glass chrome.
            bottom: "max(48px, env(safe-area-inset-bottom, 0px))",
            ...style,
          }}
          aria-hidden
          onClick={(e) => {
            e.preventDefault();
            if (onClick) onClick();
            else setOpen(false);
          }}
        />
      ) : null}
    </AnimatePresence>
  );
}

type TriggerProps = {
  children: ReactNode;
  disabled?: boolean;
  className?: string;
  style?: CSSProperties;
  /** Accessible name when Trigger is the sole control (e.g. hamburger). */
  "aria-label"?: string;
};

export function Trigger({
  children,
  disabled = false,
  className = "",
  style,
  "aria-label": ariaLabel,
}: TriggerProps) {
  const {
    open,
    setOpen,
    direction,
    anchor,
    visualDuration,
    animationConfig,
  } = useMorphMenu();
  const reduced = useReducedMotion();
  const triggerBlur = reduced ? "blur(0px)" : `blur(${animationConfig.triggerBlur}px)`;
  const transition = reduced
    ? { duration: 0 }
    : {
        opacity: {
          duration: visualDuration * 0.75,
          ease: [0.4, 0, 0.2, 1] as const,
        },
        filter: {
          duration: visualDuration * 0.9,
          ease: [0.4, 0, 0.2, 1] as const,
        },
      };

  const closedFrameStyle: CSSProperties =
    direction === "top" || direction === "bottom"
      ? {
          top: direction === "bottom" ? 0 : "auto",
          bottom: direction === "top" ? 0 : "auto",
          left: anchor === "start" ? 0 : anchor === "center" ? "50%" : "auto",
          right: anchor === "end" ? 0 : "auto",
          translate: anchor === "center" ? "-50% 0" : undefined,
          width: "var(--morph-menu-closed-width)",
          height: "var(--morph-menu-closed-height)",
        }
      : {
          top: "50%",
          bottom: "auto",
          left: direction === "right" ? 0 : "auto",
          right: direction === "left" ? 0 : "auto",
          translate: "0 -50%",
          width: "var(--morph-menu-closed-width)",
          height: "var(--morph-menu-closed-height)",
        };

  return (
    <motion.button
      data-ios-pointer-target={disabled || open ? undefined : ""}
      type="button"
      disabled={disabled}
      tabIndex={open ? -1 : undefined}
      aria-label={ariaLabel}
      aria-expanded={open}
      aria-haspopup="menu"
      initial={false}
      animate={{
        opacity: open ? 0 : 1,
        filter: open ? triggerBlur : "blur(0px)",
        transition: transition,
      }}
      className={className}
      style={{
        position: "absolute",
        // The shell grows into the open panel, but the outgoing trigger must
        // retain its closed geometry and anchor. Otherwise its children are
        // re-centered into the full panel on the first expansion frame.
        ...closedFrameStyle,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        // Keep this layer mounted so it can crossfade with Content in both
        // directions, but remove it from hit testing while the menu is open.
        pointerEvents: open ? "none" : "auto",
        border: 0,
        background: "transparent",
        padding: 0,
        // Avoid 300ms tap delay / gesture ambiguity on mobile WebKit.
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) setOpen(true);
      }}
      onKeyDown={(e) => {
        if (disabled) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen(true);
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setOpen(true);
        }
      }}
    >
      {children}
    </motion.button>
  );
}

type ContentProps = {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onAnimationComplete?: () => void;
  onPointerLeave?: () => void;
};

export function Content({
  children,
  className = "",
  style,
  onAnimationComplete,
  onPointerLeave,
}: ContentProps) {
  const {
    open,
    contentRef,
    animationConfig,
    direction,
    visualDuration,
    bounce,
    isOpenAnimationCompleteRef,
  } = useMorphMenu();
  const reduced = useReducedMotion();
  const transformTransition = reduced
    ? { duration: 0 }
    : { type: "spring" as const, visualDuration: visualDuration * 0.85, bounce };
  const contentBlur = reduced ? "blur(0px)" : `blur(${animationConfig.contentBlur}px)`;
  const contentDelay = reduced || !open ? 0 : animationConfig.contentDelay;
  const opacityTransition = reduced
    ? { duration: 0 }
    : {
        duration: visualDuration * 0.75,
        ease: [0.4, 0, 0.2, 1] as const,
        delay: contentDelay,
      };
  const blurTransition = reduced
    ? { duration: 0 }
    : {
        duration: visualDuration * 0.9,
        ease: [0.4, 0, 0.2, 1] as const,
        delay: contentDelay,
      };

  const closedOffset = (() => {
    switch (direction) {
      case "top":
        return { x: 0, y: 4 };
      case "bottom":
        return { x: 0, y: -4 };
      case "left":
        return { x: 4, y: 0 };
      case "right":
        return { x: -4, y: 0 };
    }
  })();
  return (
    <motion.div
      ref={(node) => {
        contentRef.current = node;
      }}
      role="menu"
      aria-hidden={!open}
      className={className}
      style={{
        position: "relative",
        // Keep the open content in the shell's pointer-event path while it
        // morphs so GlassShellBackdrop can light the newly revealed panel.
        // Item-level handlers and pointer attributes remain locked below until
        // the shell settles, so rows do not hover, attract, or select early.
        pointerEvents: open ? "auto" : "none",
        ...style,
      }}
      initial={false}
      animate={{
        opacity: open ? 1 : 0,
        filter: open ? "blur(0px)" : contentBlur,
        scale: open ? 1 : 0.985,
        x: open ? 0 : closedOffset.x,
        y: open ? 0 : closedOffset.y,
        transition: {
          opacity: opacityTransition,
          filter: blurTransition,
          scale: { ...transformTransition, delay: contentDelay },
          x: { ...transformTransition, delay: contentDelay },
          y: { ...transformTransition, delay: contentDelay },
        },
      }}
      onAnimationComplete={() => {
        if (open) {
          isOpenAnimationCompleteRef.current = true;
          onAnimationComplete?.();
        }
      }}
      onPointerLeave={onPointerLeave}
    >
      {children}
    </motion.div>
  );
}

type ItemProps = {
  children: ReactNode;
  onSelect?: () => void;
  onPointerEnter?: (event: ReactPointerEvent<HTMLDivElement>) => void;
  disabled?: boolean;
  closeOnSelect?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function Item({
  children,
  onSelect,
  onPointerEnter,
  disabled = false,
  closeOnSelect = true,
  className = "",
  style,
}: ItemProps) {
  const { open, setOpen, morphing, isOpenAnimationCompleteRef } = useMorphMenu();
  const canRespondToHover = () =>
    !morphing && isOpenAnimationCompleteRef.current && !disabled;

  return (
    <div
      role="menuitem"
      data-ios-pointer-hit-area={disabled || !open || morphing ? undefined : ""}
      aria-disabled={disabled || undefined}
      data-disabled={disabled || undefined}
      style={{
        cursor: disabled ? "not-allowed" : "pointer",
        userSelect: "none",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        ...style,
      }}
      onClick={(e) => {
        e.preventDefault();
        if (disabled || !open || morphing) return;
        onSelect?.();
        if (closeOnSelect) setOpen(false);
      }}
      onMouseEnter={() => {
        if (!canRespondToHover()) return;
      }}
      onPointerEnter={(event) => {
        if (!canRespondToHover()) return;
        onPointerEnter?.(event);
      }}
      // The menu can expand underneath an already-stationary pointer. In that
      // case no pointerenter is fired for the newly mounted first item, while
      // pointermove still is. Let the owner initialize its shared hover fill.
      onPointerMove={(event) => {
        if (!canRespondToHover()) return;
        onPointerEnter?.(event);
      }}
    >
      <div
        data-ios-pointer-visual={disabled ? undefined : ""}
        className={`pointer-events-none ${className}`}
      >
        {children}
      </div>
    </div>
  );
}

