// Glass shell chrome — radius is driven by MorphMenu motion values, not Tailwind
// rounded-* toggles (switching rounded-full the instant `open` flips false was
// fighting the spring and made close refraction look like it vanished).
export const morphGlassShellClassName =
  "glass-shell glass-shell-closed site-header-glass-shadow bg-transparent text-white";

/** @deprecated Use morphGlassShellClassName — kept for call-site clarity. */
export const morphClosedGlassPillClassName = morphGlassShellClassName;
export const morphOpenGlassPanelClassName = morphGlassShellClassName;

export const morphItemClassName =
  "relative z-10 flex items-center gap-3 whitespace-nowrap rounded-2xl px-3.5 py-2.5 text-[15px] font-medium text-white";

// MorphMenu measures content height when it opens. If labels wrap at the still-
// closed pill width, the measured height is too tall for the whole open state.
// `whitespace-nowrap` keeps items single-line so the first measurement is correct.
export const morphMenuAnimationConfig = {
  triggerBlur: 8,
  contentBlur: 10,
  contentDelay: 0,
} as const;

export const morphMenuRootProps = {
  direction: "bottom" as const,
  anchor: "end" as const,
  visualDuration: 0.28,
  bounce: 0,
  animationConfig: morphMenuAnimationConfig,
};

export const morphMenuContainerProps = {
  buttonSize: 48,
  menuRadius: 24,
  buttonRadius: 24,
  offset: 36,
};

