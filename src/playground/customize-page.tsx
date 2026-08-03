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
    const root = document.documentElement;
    root.classList.add("customize-page-active");
    return () => {
      document.title = previous;
      root.classList.remove("customize-page-active");
    };
  }, []);

  return (
    <>
      <IOSPointer />
      <div className="static-backdrop" aria-hidden />

      <Link to="/" className="customize-page__back" aria-label="Back to home">
        <HugeiconsIcon
          icon={ArrowLeft01Icon}
          size={18}
          color="currentColor"
          strokeWidth={1.75}
          aria-hidden
        />
      </Link>

      <main className="customize-page" id="top">
        <CustomizeShowcase />
      </main>
    </>
  );
}
