"use client";

import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useCallback,
  type ReactNode,
  type RefObject,
} from "react";
import type { Anchor, Direction } from "./offsets";

export type MorphAnimationConfig = {
  triggerBlur: number;
  contentBlur: number;
  contentDelay: number;
};

export type MorphSize = {
  width: number;
  height: number;
  borderRadius: number;
};

export type MorphMenuContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  direction: Direction;
  anchor: Anchor;
  visualDuration: number;
  bounce: number;
  animationConfig: MorphAnimationConfig;
  shellRef: RefObject<HTMLDivElement | null>;
  contentRef: RefObject<HTMLDivElement | null>;
  isOpenAnimationCompleteRef: RefObject<boolean>;
  /** Live shell size for glass — updated every morph frame. */
  subscribeMorphSize: (listener: (size: MorphSize) => void) => () => void;
  reportMorphSize: (size: MorphSize) => void;
  getMorphSize: () => MorphSize | null;
  /** True while width/height spring is running. */
  morphing: boolean;
  setMorphing: (morphing: boolean) => void;
};

const MorphMenuContext = createContext<MorphMenuContextValue | null>(null);

export function useMorphMenu() {
  const ctx = useContext(MorphMenuContext);
  if (!ctx) {
    throw new Error("MorphMenu components must be used within MorphMenu.Root");
  }
  return ctx;
}

/** Optional — GlassShellBackdrop uses this when nested in a MorphMenu. */
export function useMorphMenuOptional() {
  return useContext(MorphMenuContext);
}

const defaultAnimationConfig: MorphAnimationConfig = {
  triggerBlur: 8,
  contentBlur: 10,
  contentDelay: 0,
};

type ProviderProps = {
  children: ReactNode;
  open: boolean;
  setOpen: (open: boolean) => void;
  direction: Direction;
  anchor: Anchor;
  visualDuration: number;
  bounce: number;
  animationConfig?: Partial<MorphAnimationConfig>;
};

export function MorphMenuProvider({
  children,
  open,
  setOpen,
  direction,
  anchor,
  visualDuration,
  bounce,
  animationConfig: animationConfigProp,
}: ProviderProps) {
  const shellRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const isOpenAnimationCompleteRef = useRef(false);
  const listenersRef = useRef(new Set<(size: MorphSize) => void>());
  const lastSizeRef = useRef<MorphSize | null>(null);
  const [morphing, setMorphing] = useState(false);

  const requestOpen = useCallback(
    (next: boolean) => {
      if (next === open) return;
      // Set the interaction lock in the same event as the open-state change.
      // Container's layout effect remains as a fallback for externally
      // controlled changes that bypass this function.
      isOpenAnimationCompleteRef.current = false;
      setMorphing(true);
      setOpen(next);
    },
    [open, setOpen],
  );

  const animationConfig = useMemo(
    () => ({ ...defaultAnimationConfig, ...animationConfigProp }),
    [animationConfigProp],
  );

  const reportMorphSize = useCallback((size: MorphSize) => {
    lastSizeRef.current = size;
    for (const listener of listenersRef.current) {
      listener(size);
    }
  }, []);

  const subscribeMorphSize = useCallback((listener: (size: MorphSize) => void) => {
    listenersRef.current.add(listener);
    if (lastSizeRef.current) listener(lastSizeRef.current);
    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const getMorphSize = useCallback(() => lastSizeRef.current, []);

  const value = useMemo<MorphMenuContextValue>(
    () => ({
      open,
      setOpen: requestOpen,
      direction,
      anchor,
      visualDuration,
      bounce,
      animationConfig,
      shellRef,
      contentRef,
      isOpenAnimationCompleteRef,
      subscribeMorphSize,
      reportMorphSize,
      getMorphSize,
      morphing,
      setMorphing,
    }),
    [
      open,
      requestOpen,
      direction,
      anchor,
      visualDuration,
      bounce,
      animationConfig,
      subscribeMorphSize,
      reportMorphSize,
      getMorphSize,
      morphing,
    ],
  );

  return <MorphMenuContext.Provider value={value}>{children}</MorphMenuContext.Provider>;
}

