"use client";

import { useEffect } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons";
import { IOSPointer } from "../../registry/liquid-glass/compositions/ios-pointer";
import { CustomizeShowcase } from "./customize-showcase";
import { Link } from "./router";

export function CustomizePage() {
  useEffect(() => {
    const previous = document.title;
    document.title = "Customize · Parallax Glass";
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <>
      <IOSPointer />
      <div className="static-backdrop" aria-hidden />

      <header className="customize-page__nav">
        <Link to="/" className="customize-page__back">
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={16}
            color="currentColor"
            strokeWidth={1.75}
            aria-hidden
          />
          <span>Home</span>
        </Link>
        <Link to="/" className="site-brand customize-page__brand">
          Parallax Glass
        </Link>
      </header>

      <main className="customize-page" id="top">
        <div className="customize-page__header">
          <p className="customize-page__eyebrow">Playground</p>
          <h1 className="customize-page__title">Customize</h1>
          <p className="customize-page__lede">
            Start from a preset, then tune material, engine, and pointer-highlight
            overrides for this preview only.
          </p>
        </div>

        <CustomizeShowcase />
      </main>
    </>
  );
}
