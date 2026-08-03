"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  Home01Icon,
  Menu01Icon,
  Search01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";
import { GlassSegmentedControl } from "../../registry/liquid-glass/compositions/glass-segmented-control";
import { GlassShellBackdrop } from "../../registry/liquid-glass/compositions/glass-shell-backdrop";
import { GlassIconPill } from "../../registry/liquid-glass/compositions/glass-icon-pill";
import {
  MorphMenuHoverFill,
  useMorphMenuHover,
} from "../../registry/liquid-glass/compositions/morph-menu-hover";
import { MorphMenu } from "../../registry/liquid-glass/compositions/morph-menu";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "../components/ui/carousel";

const segmentItems = [
  { value: "overview", label: "Overview" },
  { value: "motion", label: "Motion" },
  { value: "optics", label: "Optics" },
];

const menuItems = ["Overview", "Components", "Installation", "Documentation"];

const showcaseIconPills = [
  { icon: Home01Icon, label: "Home" },
  { icon: Search01Icon, label: "Search" },
  { icon: Settings01Icon, label: "Settings" },
] as const;

function ShowcaseMorphMenu({
  defaultOpen = false,
}: {
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const { clearHoveredItem, hoveredItem, syncHoveredItem } = useMorphMenuHover();

  return (
    <div>
      <MorphMenu.Root
        open={open}
        onOpenChange={(next) => {
          clearHoveredItem();
          setOpen(next);
        }}
        direction="bottom"
        anchor="start"
        visualDuration={0.28}
        bounce={0}
        closeOnClickOutside={!defaultOpen}
      >
        <MorphMenu.Container
          buttonSize={48}
          menuWidth={248}
          menuRadius={28}
          buttonRadius={24}
          offset={12}
          className="component-menu__shell"
          backdrop={<GlassShellBackdrop borderRadius={28} material="navigation" />}
        >
          <MorphMenu.Trigger
            aria-label={open ? "Close menu" : "Open menu"}
            className="navigation-menu__trigger"
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
          </MorphMenu.Trigger>

          <MorphMenu.Content
            className="navigation-menu__content"
            onPointerLeave={clearHoveredItem}
          >
            <div className="navigation-menu__items">
              <MorphMenuHoverFill hoveredItem={hoveredItem} />
              {menuItems.map((item) => (
                <MorphMenu.Item
                  key={item}
                  className="navigation-menu__item"
                  onPointerEnter={syncHoveredItem}
                >
                  <span>{item}</span>
                </MorphMenu.Item>
              ))}
            </div>
          </MorphMenu.Content>
        </MorphMenu.Container>
      </MorphMenu.Root>
    </div>
  );
}

export function PrebuiltComponentsCarousel() {
  const [restingSegmentValue, setRestingSegmentValue] = useState("motion");
  const [pressedSegmentValue, setPressedSegmentValue] = useState("motion");

  return (
    <section className="component-section" id="components">
      <div className="section-heading">
        <h2>Components</h2>
        <p>
          Source-owned compositions ready to install, adapt, and ship with the primitive.
        </p>
      </div>

      <Carousel
        className="showcase-carousel showcase-carousel--components"
        opts={{ align: "start", containScroll: "trimSnaps", dragFree: true }}
        aria-label="Liquid glass components"
      >
        <div className="showcase-carousel__controls">
          <CarouselPrevious className="showcase-carousel__button" />
          <CarouselNext className="showcase-carousel__button" />
        </div>
        <CarouselContent className="showcase-carousel__track">
          <CarouselItem className="showcase-carousel__item showcase-carousel__item--component">
            <article className="component-card">
              <img className="showcase-card__scene" src="/images/pexels-bento-scene.jpg" alt="" aria-hidden="true" />
              <div className="showcase-card__veil" aria-hidden="true" />
              <span className="component-card__label">Menu</span>
              <div className="component-card__stage component-card__menu-states">
                <div className="component-card__state component-card__state--expanded-menu">
                  <span>Expanded</span>
                  <div className="component-card__menu-preview component-card__menu-preview--expanded">
                    <ShowcaseMorphMenu defaultOpen />
                  </div>
                </div>
              </div>
            </article>
          </CarouselItem>

          <CarouselItem className="showcase-carousel__item showcase-carousel__item--component">
            <article className="component-card">
              <img className="showcase-card__scene" src="/images/pexels-bento-scene.jpg" alt="" aria-hidden="true" />
              <div className="showcase-card__veil" aria-hidden="true" />
              <span className="component-card__label">Segmented Control</span>
              <div className="component-card__stage component-card__stage--center">
                <div className="component-card__segment-states">
                  <div className="component-card__state component-card__state--segment component-card__state--resting">
                    <span>Resting</span>
                    <GlassSegmentedControl
                      items={segmentItems}
                      value={restingSegmentValue}
                      onValueChange={setRestingSegmentValue}
                      itemWidth={80}
                      itemHeight={40}
                      padding={4}
                      radialExpansion={8}
                      material="navigation"
                      pressedMaterial="selectionPressed"
                      itemClassName="segment-item"
                    />
                  </div>
                  <div className="component-card__state component-card__state--segment">
                    <span>Pressed</span>
                    <GlassSegmentedControl
                      items={segmentItems}
                      value={pressedSegmentValue}
                      onValueChange={setPressedSegmentValue}
                      itemWidth={80}
                      itemHeight={40}
                      padding={4}
                      radialExpansion={8}
                      material="navigation"
                      pressedMaterial="selectionPressed"
                      pressedPreview
                      itemClassName="segment-item"
                    />
                  </div>
                </div>
              </div>
            </article>
          </CarouselItem>

          <CarouselItem className="showcase-carousel__item showcase-carousel__item--component">
            <article className="component-card">
              <img className="showcase-card__scene" src="/images/pexels-bento-scene.jpg" alt="" aria-hidden="true" />
              <div className="showcase-card__veil" aria-hidden="true" />
              <span className="component-card__label">Icon Pills</span>
              <div className="component-card__stage component-card__stage--center component-card__icons">
                {showcaseIconPills.map(({ icon, label }) => (
                  <button
                    key={label}
                    type="button"
                    className="component-card__icon-button"
                    data-ios-pointer-target=""
                    aria-label={label}
                  >
                    <GlassIconPill size={48} material="navigation">
                      <HugeiconsIcon
                        icon={icon}
                        size={20}
                        color="currentColor"
                        strokeWidth={1.75}
                        className="component-card__icon"
                        aria-hidden
                      />
                    </GlassIconPill>
                  </button>
                ))}
              </div>
            </article>
          </CarouselItem>
        </CarouselContent>
      </Carousel>
    </section>
  );
}
