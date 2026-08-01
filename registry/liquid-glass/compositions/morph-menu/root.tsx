"use client";

import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  MorphMenuProvider,
  useMorphMenu,
  type MorphAnimationConfig,
} from "./context";
import type { Anchor, Direction } from "./offsets";

type RootProps = {
  children: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  direction?: Direction;
  anchor?: Anchor;
  visualDuration?: number;
  bounce?: number;
  animationConfig?: Partial<MorphAnimationConfig>;
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
};

function useControllableOpen(
  controlled: boolean | undefined,
  defaultOpen: boolean,
  onOpenChange?: (open: boolean) => void,
) {
  const [uncontrolled, setUncontrolled] = useState(defaultOpen);
  const isControlled = controlled !== undefined;
  const open = isControlled ? controlled : uncontrolled;

  const setOpen = useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolled(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange],
  );

  return [open, setOpen] as const;
}

function DismissListeners({
  closeOnClickOutside,
  closeOnEscape,
}: {
  closeOnClickOutside: boolean;
  closeOnEscape: boolean;
}) {
  const { open, setOpen, shellRef, contentRef } = useMorphMenu();

  useEffect(() => {
    if (!open || !closeOnEscape) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, closeOnEscape, setOpen]);

  useEffect(() => {
    if (!open || !closeOnClickOutside) return;
    // Capture-phase pointerdown so we can swallow the gesture: without a
    // fullscreen fixed overlay (avoided for iOS Safari toolbar tint), taps
    // would otherwise both dismiss and activate controls underneath.
    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (shellRef.current?.contains(target)) return;
      if (contentRef.current?.contains(target)) return;
      setOpen(false);
      e.preventDefault();
      e.stopPropagation();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [open, closeOnClickOutside, setOpen, shellRef, contentRef]);

  return null;
}

export function Root({
  children,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  direction = "bottom",
  anchor: anchorProp = "start",
  visualDuration = 0.28,
  bounce = 0,
  animationConfig,
  closeOnClickOutside = true,
  closeOnEscape = true,
}: RootProps) {
  const anchor =
    direction === "left" || direction === "right" ? "center" : anchorProp;
  const [open, setOpen] = useControllableOpen(openProp, defaultOpen, onOpenChange);

  const handleSetOpen = useCallback(
    (next: boolean) => {
      setOpen(next);
    },
    [setOpen],
  );

  return (
    <MorphMenuProvider
      open={open}
      setOpen={handleSetOpen}
      direction={direction}
      anchor={anchor}
      visualDuration={visualDuration}
      bounce={bounce}
      animationConfig={animationConfig}
    >
      <DismissListeners
        closeOnClickOutside={closeOnClickOutside}
        closeOnEscape={closeOnEscape}
      />
      {children}
    </MorphMenuProvider>
  );
}

