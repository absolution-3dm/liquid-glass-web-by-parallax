"use client";

import { useEffect, useState } from "react";
import { LiquidGlass } from "../registry/liquid-glass/liquid-glass";
import { IOSPointer } from "../registry/liquid-glass/compositions/ios-pointer";
import { CustomizeShowcase } from "./playground/customize-showcase";
import { heroCtaMaterial, topNavigationItems } from "./playground/data";
import { HeroFloatStage } from "./playground/hero-float-stage";
import { InstallationShowcase } from "./playground/installation-showcase";
import { MaterialAttributesCarousel } from "./playground/material-attributes-carousel";
import { PrebuiltComponentsCarousel } from "./playground/prebuilt-components-carousel";
import { SiteMobileNav } from "./playground/site-mobile-nav";

export function Playground() {
  const [topNavigationValue, setTopNavigationValue] = useState("menu");

  useEffect(() => {
    let frame = 0;
    const updateActiveSection = () => {
      frame = 0;
      const activationLine = window.innerHeight * 0.3;
      let activeValue = topNavigationItems[0].value;

      for (const item of topNavigationItems) {
        const section = document.getElementById(item.value);
        if (!section) continue;
        if (section.getBoundingClientRect().top <= activationLine) {
          activeValue = item.value;
        }
      }

      setTopNavigationValue((current) =>
        current === activeValue ? current : activeValue,
      );
    };
    const scheduleUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateActiveSection);
    };

    updateActiveSection();
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
    };
  }, []);

  const navigateToSection = (value: string) => {
    document.getElementById(value)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <IOSPointer />
      <div className="static-backdrop" aria-hidden />

      <header className="site-navigation">
        <a className="site-brand" href="#top">
          Parallax Glass
        </a>

        <nav className="site-nav-links" aria-label="Primary">
          {topNavigationItems.map((item) => (
            <a
              key={item.value}
              href={item.href}
              className={
                topNavigationValue === item.value
                  ? "site-nav-link is-active"
                  : "site-nav-link"
              }
              onClick={(event) => {
                event.preventDefault();
                navigateToSection(item.value);
              }}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="site-nav-mobile">
          <SiteMobileNav
            activeValue={topNavigationValue}
            onNavigate={navigateToSection}
          />
        </div>
      </header>

      <main id="top">
        <section className="hero" id="menu">
          <div className="hero-media" aria-hidden="true">
            <div className="hero-media__veil" />
          </div>
          <div className="hero-inner">
            <div className="hero-copy">
              <h1>Parallax Glass for the web.</h1>
              <p className="hero-lede">
                Native-feeling glass surfaces — crafted, customizable, source
                you own.
              </p>
              <a
                className="hero-cta"
                href="#installation"
                data-ios-pointer-target=""
              >
                <LiquidGlass
                  width={120}
                  height={44}
                  borderRadius={22}
                  material={heroCtaMaterial}
                  className="hero-cta__glass"
                >
                  <span className="hero-cta__label">Install</span>
                </LiquidGlass>
              </a>
            </div>
            <HeroFloatStage />
          </div>
        </section>

        <MaterialAttributesCarousel />
        <PrebuiltComponentsCarousel />
        <CustomizeShowcase />
        <InstallationShowcase />

        <footer>
          <span>Parallax Glass</span>
          <span>shadcn Registry</span>
        </footer>
      </main>
    </>
  );
}
