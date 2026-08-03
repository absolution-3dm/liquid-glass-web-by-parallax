"use client";

import { useEffect, useRef, useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, Menu01Icon } from "@hugeicons/core-free-icons";
import { topNavigationItems } from "./data";

export function SiteMobileNav({
  activeValue,
  onNavigate,
}: {
  activeValue: string;
  onNavigate: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="site-nav-mobile__root" ref={rootRef}>
      <button
        type="button"
        className="site-nav-mobile__icon"
        aria-label={open ? "Close navigation" : "Open navigation"}
        aria-expanded={open}
        aria-controls="site-nav-mobile-menu"
        onClick={() => setOpen((current) => !current)}
      >
        <HugeiconsIcon
          icon={Menu01Icon}
          altIcon={Cancel01Icon}
          showAlt={open}
          size={20}
          color="currentColor"
          strokeWidth={1.75}
          aria-hidden
        />
      </button>

      {open ? (
        <nav
          id="site-nav-mobile-menu"
          className="site-nav-mobile__menu"
          aria-label="Primary"
        >
          {topNavigationItems.map((item) => (
            <a
              key={item.value}
              href={item.href}
              className={
                activeValue === item.value
                  ? "site-nav-mobile__link is-active"
                  : "site-nav-mobile__link"
              }
              onClick={(event) => {
                event.preventDefault();
                setOpen(false);
                onNavigate(item.value);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
