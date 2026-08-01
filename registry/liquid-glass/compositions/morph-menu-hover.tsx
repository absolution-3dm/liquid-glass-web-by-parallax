"use client";

import { motion } from "motion/react";
import {
  useCallback,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

type HoveredItem = {
  height: number;
  top: number;
};

const hoverTransition = {
  opacity: { duration: 0.14, ease: [0.4, 0, 0.2, 1] as const },
  // Commit the row geometry before revealing the fill so first entry is a
  // plain fade rather than an interpolation from a zero-height rectangle.
  y: { duration: 0 },
  height: { duration: 0 },
};

export function useMorphMenuHover() {
  const [hoveredItem, setHoveredItem] = useState<HoveredItem | null>(null);

  const clearHoveredItem = useCallback(() => {
    setHoveredItem(null);
  }, []);

  const syncHoveredItem = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const next = {
        top: event.currentTarget.offsetTop,
        height: event.currentTarget.offsetHeight,
      };
      setHoveredItem((current) =>
        current?.top === next.top && current.height === next.height ? current : next,
      );
    },
    [],
  );

  return { clearHoveredItem, hoveredItem, syncHoveredItem };
}

export function MorphMenuHoverFill({
  hoveredItem,
}: {
  hoveredItem: HoveredItem | null;
}) {
  return (
    <motion.div
      aria-hidden
      className="ios-pointer-native-hover-fill pointer-events-none absolute left-1.5 right-1.5 top-0 rounded-2xl"
      style={{ backgroundColor: "var(--fr-hover-fill)" }}
      initial={false}
      animate={{
        y: hoveredItem ? hoveredItem.top : undefined,
        height: hoveredItem ? hoveredItem.height : undefined,
        opacity: hoveredItem ? 1 : 0,
      }}
      transition={hoverTransition}
    />
  );
}

