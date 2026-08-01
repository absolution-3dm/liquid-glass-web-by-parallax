"use client";

import { useEffect, useRef } from "react";

const MAX_ATTRACTION_PX = 5;
const ATTRACTION_CURVE_EXPONENT = 1.1;
const ATTRACTION_PROXIMITY_PX = 24;
const ATTRACTION_EDGE_RAMP_PX = 24;
const ATTRACTION_EXIT_MARGIN_PX = 16;
const TARGET_SPRING_STIFFNESS = 260;
const TARGET_SPRING_DAMPING = 29;
const TARGET_SPRING_MASS = 0.8;

// Press-drag deformation (Apple liquid-glass buttons): while the primary
// button is held, the control follows the pointer with a rubber-band that
// asymptotes at PRESS_MAX_TRAVEL_PX — so it deforms and shifts toward the
// cursor but can never be dragged away — and springs back on release. The
// jelly squish is derived from the spring-eased displacement (not raw pointer
// velocity), so it is inherently smooth and settles together with the travel.
const PRESS_MAX_TRAVEL_PX = 8; // rubber-band asymptote → can't be dragged off
// Pre-scale on the drag distance before it hits the tanh: the control lags the
// cursor from the very first pixel (resistance felt continuously) instead of
// tracking 1:1 and then slamming into the asymptote — the same "pre-tensioned
// spring" feel as the draggable glass capsules.
const PRESS_RESISTANCE = 0.55;
const PRESS_STRETCH = 0.14; // elongation along the drag axis at full travel
const PRESS_STRETCH_PERP = 0.14; // perpendicular compression (volume-conserving)
const PRESS_LIFT = 0.07; // gentle uniform "pop"/enlarge while held
const PRESS_CLICK_CANCEL_PX = 6; // travel beyond this swallows the click

export const IOS_POINTER_CANCEL_ATTRACTION_EVENT =
  "ios-pointer-cancel-attraction";

type AttractedTarget = {
  companion: HTMLElement | null;
  element: HTMLElement;
  hitArea: HTMLElement;
  exitMargin: number;
  maxAttraction: number;
  proximity: number;
  exiting: boolean;
  frame: number | null;
  lastTime: number | null;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
  // Press-drag deformation state.
  pressing: boolean;
  pressOriginX: number;
  pressOriginY: number;
  maxTravel: number;
  press: number; // eased 0→1 press amount
  pressV: number;
  pressTarget: number; // 0 released / 1 held
};

type AttractionTarget = {
  element: HTMLElement;
  hitArea: HTMLElement;
  exitMargin: number;
  maxAttraction: number;
  proximity: number;
};

type AttractionBounds = {
  height: number;
  left: number;
  top: number;
  width: number;
};

type CompanionController = {
  element: HTMLElement;
  exiting: boolean;
  frame: number | null;
  lastTime: number | null;
  maxAttraction: number;
  proximity: number;
  pointerX: number;
  pointerY: number;
  targetX: number;
  targetY: number;
  vx: number;
  vy: number;
  x: number;
  y: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function mapAttraction(relativePosition: number, maxAttraction: number) {
  const normalized = clamp(relativePosition, -1, 1);
  return (
    Math.sign(normalized) *
    Math.pow(Math.abs(normalized), ATTRACTION_CURVE_EXPONENT) *
    maxAttraction
  );
}

function getAttractionDepth(
  pointerX: number,
  pointerY: number,
  left: number,
  top: number,
  width: number,
  height: number,
) {
  return Math.max(
    0,
    Math.min(
      pointerX - left,
      left + width - pointerX,
      pointerY - top,
      top + height - pointerY,
    ),
  );
}

function applyAttractionEnvelope(
  x: number,
  y: number,
  insideDepth: number,
  outsideDistance: number,
  proximity: number,
) {
  // Treat the outer proximity boundary and the inside edge ramp as one
  // continuous field. At the outer boundary attraction is exactly zero; it
  // grows through the element edge and reaches full strength after the
  // pointer has travelled EDGE_RAMP_PX inside.
  const fieldDepth = proximity - outsideDistance + insideDepth;
  const rampLength = Math.max(proximity + ATTRACTION_EDGE_RAMP_PX, 1);
  const progress = clamp(fieldDepth / rampLength, 0, 1);
  const easedProgress = progress * progress * (3 - 2 * progress);
  return { x: x * easedProgress, y: y * easedProgress };
}

function getOutsideDistance(
  pointerX: number,
  pointerY: number,
  left: number,
  top: number,
  width: number,
  height: number,
) {
  const dx = Math.max(left - pointerX, 0, pointerX - (left + width));
  const dy = Math.max(top - pointerY, 0, pointerY - (top + height));
  return Math.hypot(dx, dy);
}

function getTargetNumber(element: HTMLElement, name: string, fallback: number) {
  const value = Number(element.dataset[name]);
  return Number.isFinite(value) ? value : fallback;
}

function createAttractionTarget(element: HTMLElement, hitArea = element): AttractionTarget {
  return {
    element,
    hitArea,
    exitMargin: getTargetNumber(
      hitArea,
      "iosPointerExitMargin",
      ATTRACTION_EXIT_MARGIN_PX,
    ),
    maxAttraction: getTargetNumber(
      hitArea,
      "iosPointerMaxAttraction",
      MAX_ATTRACTION_PX,
    ),
    proximity: getTargetNumber(
      hitArea,
      "iosPointerProximity",
      ATTRACTION_PROXIMITY_PX,
    ),
  };
}

function getAttractionTarget(target: EventTarget | null) {
  if (!(target instanceof Element)) return null;

  const hitArea = target.closest<HTMLElement>("[data-ios-pointer-hit-area]");
  if (hitArea) {
    const visual = hitArea.querySelector<HTMLElement>("[data-ios-pointer-visual]");
    return visual ? createAttractionTarget(visual, hitArea) : null;
  }

  const explicit = target.closest<HTMLElement>("[data-ios-pointer-target]");
  if (explicit) {
    if (explicit.matches(".site-hover-fill")) {
      return createAttractionTarget(explicit);
    }
    const element =
      explicit.closest<HTMLElement>(".glass-surface, .glass-shell") ?? explicit;
    if (element.hasAttribute("data-ios-pointer-attraction-disabled")) {
      return null;
    }
    return createAttractionTarget(element);
  }

  const interactive = target.closest<HTMLElement>(
    'a, button:not(:disabled), input[type="button"]:not(:disabled)',
  );
  if (!interactive) return null;
  if (interactive.matches(".site-hover-fill")) {
    return createAttractionTarget(interactive);
  }

  const element = interactive.closest<HTMLElement>(".glass-surface, .glass-shell");
  if (
    !element ||
    element.hasAttribute("data-ios-pointer-attraction-disabled")
  ) {
    return null;
  }
  return createAttractionTarget(element);
}

/**
 * iPad-style pointer: the dot tracks the mouse exactly while interactive
 * controls move subtly toward it. The pointer itself never morphs or snaps.
 */
export function IOSPointer() {
  const targetRef = useRef<AttractedTarget | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!window.matchMedia("(pointer: fine)").matches) return;

    root.classList.add("ios-pointer-ready");
    const controllers = new Set<AttractedTarget>();
    const companionControllers = new Map<HTMLElement, CompanionController>();
    let proximityCandidatesDirty = true;
    let proximityCandidates: Array<{
      bounds: AttractionBounds;
      target: AttractionTarget;
    }> = [];

    const getBaseBounds = (target: AttractionTarget) => {
      const rect = target.hitArea.getBoundingClientRect();
      const movingController =
        target.hitArea === target.element
          ? Array.from(controllers).find(
              (controller) => controller.element === target.element,
            )
          : undefined;
      const offsetX = movingController?.x ?? 0;
      const offsetY = movingController?.y ?? 0;
      return {
        height: rect.height,
        left: rect.left - offsetX,
        top: rect.top - offsetY,
        width: rect.width,
      };
    };

    const refreshProximityCandidates = () => {
      const candidates = document.querySelectorAll<HTMLElement>(
        [
          "[data-ios-pointer-hit-area]",
          "[data-ios-pointer-target]",
          ".site-hover-fill",
          ".glass-surface a",
          ".glass-surface button:not(:disabled)",
          ".glass-shell a",
          ".glass-shell button:not(:disabled)",
        ].join(","),
      );
      const seen = new Set<HTMLElement>();
      const nextCandidates: typeof proximityCandidates = [];

      for (const candidate of candidates) {
        const target = getAttractionTarget(candidate);
        if (
          !target ||
          seen.has(target.element) ||
          !target.hitArea.isConnected ||
          target.hitArea.getClientRects().length === 0
        ) {
          continue;
        }
        seen.add(target.element);
        nextCandidates.push({ bounds: getBaseBounds(target), target });
      }

      proximityCandidates = nextCandidates;
      proximityCandidatesDirty = false;
    };

    const getProximityTarget = (pointerX: number, pointerY: number) => {
      if (proximityCandidatesDirty) refreshProximityCandidates();
      let closest: { distance: number; target: AttractionTarget } | null = null;

      for (const { bounds, target } of proximityCandidates) {
        const distance = getOutsideDistance(
          pointerX,
          pointerY,
          bounds.left,
          bounds.top,
          bounds.width,
          bounds.height,
        );
        if (distance > target.proximity) continue;
        if (!closest || distance < closest.distance) {
          closest = { distance, target };
        }
      }

      return closest?.target ?? null;
    };

    const invalidateProximityCandidates = () => {
      proximityCandidatesDirty = true;
    };
    const proximityObserver = new MutationObserver(invalidateProximityCandidates);
    proximityObserver.observe(document.body, {
      attributeFilter: [
        "data-ios-pointer-attraction-disabled",
        "data-ios-pointer-exit-margin",
        "data-ios-pointer-hit-area",
        "data-ios-pointer-max-attraction",
        "data-ios-pointer-proximity",
        "data-ios-pointer-target",
        "disabled",
      ],
      attributes: true,
      childList: true,
      subtree: true,
    });
    window.addEventListener("resize", invalidateProximityCandidates, {
      passive: true,
    });
    window.addEventListener("scroll", invalidateProximityCandidates, {
      capture: true,
      passive: true,
    });

    const finishCompanionController = (controller: CompanionController) => {
      if (controller.frame !== null) cancelAnimationFrame(controller.frame);
      controller.element.style.removeProperty("--ios-pointer-attract-x");
      controller.element.style.removeProperty("--ios-pointer-attract-y");
      controller.element.removeAttribute("data-ios-pointer-hover-active");
      companionControllers.delete(controller.element);
    };

    const tickCompanionController = (
      controller: CompanionController,
      time: number,
    ) => {
      controller.frame = null;
      const elapsed =
        controller.lastTime === null ? 1 / 60 : (time - controller.lastTime) / 1000;
      const dt = Math.min(0.032, Math.max(1 / 240, elapsed));
      controller.lastTime = time;

      if (!controller.exiting) {
        // Motion is independently moving the shared fill between menu rows.
        // Derive attraction from the fill's current visual row rather than
        // from the newly hit item's center, whose local Y flips from -1 to +1
        // at every adjacent boundary. Subtract our own translate to isolate
        // Motion's continuously animated base geometry.
        const rect = controller.element.getBoundingClientRect();
        const left = rect.left - controller.x;
        const top = rect.top - controller.y;
        const centerX = left + rect.width / 2;
        const centerY = top + rect.height / 2;
        const relativeX =
          (controller.pointerX - centerX) / Math.max(rect.width / 2, 1);
        const relativeY =
          (controller.pointerY - centerY) / Math.max(rect.height / 2, 1);
        const mappedX = mapAttraction(
          relativeX,
          controller.maxAttraction,
        );
        const mappedY = mapAttraction(
          relativeY,
          controller.maxAttraction,
        );
        const depth = getAttractionDepth(
          controller.pointerX,
          controller.pointerY,
          left,
          top,
          rect.width,
          rect.height,
        );
        const outsideDistance = getOutsideDistance(
          controller.pointerX,
          controller.pointerY,
          left,
          top,
          rect.width,
          rect.height,
        );
        const limited = applyAttractionEnvelope(
          mappedX,
          mappedY,
          depth,
          outsideDistance,
          controller.proximity,
        );
        controller.targetX = limited.x;
        controller.targetY = limited.y;
      }

      const ax =
        (-TARGET_SPRING_STIFFNESS * (controller.x - controller.targetX) -
          TARGET_SPRING_DAMPING * controller.vx) /
        TARGET_SPRING_MASS;
      const ay =
        (-TARGET_SPRING_STIFFNESS * (controller.y - controller.targetY) -
          TARGET_SPRING_DAMPING * controller.vy) /
        TARGET_SPRING_MASS;
      controller.vx += ax * dt;
      controller.vy += ay * dt;
      controller.x += controller.vx * dt;
      controller.y += controller.vy * dt;

      controller.element.style.setProperty(
        "--ios-pointer-attract-x",
        `${controller.x}px`,
      );
      controller.element.style.setProperty(
        "--ios-pointer-attract-y",
        `${controller.y}px`,
      );

      const settled =
        Math.abs(controller.x - controller.targetX) < 0.02 &&
        Math.abs(controller.y - controller.targetY) < 0.02 &&
        Math.abs(controller.vx) < 0.02 &&
        Math.abs(controller.vy) < 0.02;
      if (settled) {
        controller.x = controller.targetX;
        controller.y = controller.targetY;
        if (controller.exiting) finishCompanionController(controller);
        return;
      }

      controller.frame = requestAnimationFrame((nextTime) =>
        tickCompanionController(controller, nextTime),
      );
    };

    const startCompanionController = (controller: CompanionController) => {
      if (controller.frame !== null) return;
      controller.lastTime = null;
      controller.frame = requestAnimationFrame((time) =>
        tickCompanionController(controller, time),
      );
    };

    const getCompanionController = (element: HTMLElement) => {
      const existing = companionControllers.get(element);
      if (existing) return existing;

      const controller: CompanionController = {
        element,
        exiting: false,
        frame: null,
        lastTime: null,
        maxAttraction: MAX_ATTRACTION_PX,
        proximity: ATTRACTION_PROXIMITY_PX,
        pointerX: 0,
        pointerY: 0,
        targetX: 0,
        targetY: 0,
        vx: 0,
        vy: 0,
        x: 0,
        y: 0,
      };
      companionControllers.set(element, controller);
      return controller;
    };

    const attractCompanion = (
      element: HTMLElement,
      pointerX: number,
      pointerY: number,
      maxAttraction: number,
      proximity: number,
    ) => {
      const controller = getCompanionController(element);
      controller.exiting = false;
      controller.pointerX = pointerX;
      controller.pointerY = pointerY;
      controller.maxAttraction = maxAttraction;
      controller.proximity = proximity;
      element.setAttribute("data-ios-pointer-hover-active", "");
      startCompanionController(controller);
    };

    const releaseCompanion = (element: HTMLElement) => {
      const controller = companionControllers.get(element);
      element.removeAttribute("data-ios-pointer-hover-active");
      if (!controller) return;
      controller.exiting = true;
      controller.targetX = 0;
      controller.targetY = 0;
      startCompanionController(controller);
    };

    const finishController = (controller: AttractedTarget) => {
      if (controller.frame !== null) cancelAnimationFrame(controller.frame);
      controller.element.removeAttribute("data-ios-pointer-attracted");
      controller.element.style.removeProperty("--ios-pointer-attract-x");
      controller.element.style.removeProperty("--ios-pointer-attract-y");
      controller.element.style.removeProperty("--ios-pointer-squish-x");
      controller.element.style.removeProperty("--ios-pointer-squish-y");
      controllers.delete(controller);
      if (controllers.size === 0) root.classList.remove("ios-pointer-attracting");
    };

    const tickController = (controller: AttractedTarget, time: number) => {
      controller.frame = null;
      const elapsed = controller.lastTime === null ? 1 / 60 : (time - controller.lastTime) / 1000;
      const dt = Math.min(0.032, Math.max(1 / 240, elapsed));
      controller.lastTime = time;

      const ax =
        (-TARGET_SPRING_STIFFNESS * (controller.x - controller.targetX) -
          TARGET_SPRING_DAMPING * controller.vx) /
        TARGET_SPRING_MASS;
      const ay =
        (-TARGET_SPRING_STIFFNESS * (controller.y - controller.targetY) -
          TARGET_SPRING_DAMPING * controller.vy) /
        TARGET_SPRING_MASS;
      controller.vx += ax * dt;
      controller.vy += ay * dt;
      controller.x += controller.vx * dt;
      controller.y += controller.vy * dt;

      // Press amount rides its own spring so the push-in eases in/out.
      const pAcc =
        (-TARGET_SPRING_STIFFNESS * (controller.press - controller.pressTarget) -
          TARGET_SPRING_DAMPING * controller.pressV) /
        TARGET_SPRING_MASS;
      controller.pressV += pAcc * dt;
      controller.press += controller.pressV * dt;

      controller.element.style.setProperty("--ios-pointer-attract-x", `${controller.x}px`);
      controller.element.style.setProperty("--ios-pointer-attract-y", `${controller.y}px`);

      // Jelly squish from the eased displacement: elongate along the axis the
      // control is pulled, compress the other (volume-conserving), on top of a
      // small uniform "pop"/enlarge while held. Deriving from controller.x/y
      // (spring output) keeps it smooth — no raw-velocity spikes.
      const travelAx = Math.min(1, Math.abs(controller.x) / PRESS_MAX_TRAVEL_PX);
      const travelAy = Math.min(1, Math.abs(controller.y) / PRESS_MAX_TRAVEL_PX);
      const lift = 1 + PRESS_LIFT * controller.press;
      const squishX = lift * (1 + PRESS_STRETCH * travelAx - PRESS_STRETCH_PERP * travelAy);
      const squishY = lift * (1 + PRESS_STRETCH * travelAy - PRESS_STRETCH_PERP * travelAx);
      controller.element.style.setProperty("--ios-pointer-squish-x", `${squishX}`);
      controller.element.style.setProperty("--ios-pointer-squish-y", `${squishY}`);

      const settled =
        Math.abs(controller.x - controller.targetX) < 0.02 &&
        Math.abs(controller.y - controller.targetY) < 0.02 &&
        Math.abs(controller.vx) < 0.02 &&
        Math.abs(controller.vy) < 0.02 &&
        Math.abs(controller.press - controller.pressTarget) < 0.002 &&
        Math.abs(controller.pressV) < 0.02;
      if (settled) {
        controller.x = controller.targetX;
        controller.y = controller.targetY;
        controller.press = controller.pressTarget;
        if (controller.exiting) finishController(controller);
        return;
      }

      controller.frame = requestAnimationFrame((nextTime) =>
        tickController(controller, nextTime),
      );
    };

    const startController = (controller: AttractedTarget) => {
      if (controller.frame !== null) return;
      controller.lastTime = null;
      controller.frame = requestAnimationFrame((time) => tickController(controller, time));
    };

    const releaseController = (controller: AttractedTarget) => {
      controller.exiting = true;
      controller.targetX = 0;
      controller.targetY = 0;
      if (controller.companion) releaseCompanion(controller.companion);
      startController(controller);
    };

    const clearTarget = () => {
      const active = targetRef.current;
      if (!active) return;
      releaseController(active);
      targetRef.current = null;
    };

    const cancelAttraction = (event: Event) => {
      const active = targetRef.current;
      if (
        !(event.target instanceof HTMLElement) ||
        !active ||
        (active.element !== event.target && !event.target.contains(active.element))
      ) {
        return;
      }

      // Cancel both the active row/trigger and its shared hover fill before a
      // morph begins. Neither should keep reacting to a stationary pointer
      // while the menu geometry and content layers are animating.
      if (active.companion) {
        const companion = companionControllers.get(active.companion);
        if (companion) finishCompanionController(companion);
        else active.companion.removeAttribute("data-ios-pointer-hover-active");
      }
      finishController(active);
      targetRef.current = null;
    };

    const attractTarget = (
      {
        element,
        hitArea,
        exitMargin,
        maxAttraction,
        proximity,
      }: AttractionTarget,
      clientX: number,
      clientY: number,
    ) => {
      if (targetRef.current?.element !== element) {
        const previous = targetRef.current;
        const companion =
          element
            .closest<HTMLElement>('[role="menu"]')
            ?.querySelector<HTMLElement>(".ios-pointer-native-hover-fill") ?? null;
        const sharesCompanion = Boolean(
          previous && companion && previous.companion === companion,
        );
        clearTarget();
        if (sharesCompanion && previous) previous.companion = null;
        const returning = Array.from(controllers).find(
          (controller) => controller.element === element,
        );
        if (returning) {
          // Keep the returning item's current position so re-entry is visually
          // continuous, but discard its velocity toward rest. Otherwise a
          // quick adjacent-item reversal briefly carries the item away from
          // the pointer before the new attraction target takes over.
          if (returning.frame !== null) cancelAnimationFrame(returning.frame);
          returning.frame = null;
          returning.lastTime = null;
          returning.vx = 0;
          returning.vy = 0;
        }
        element.setAttribute("data-ios-pointer-attracted", "");
        targetRef.current = returning ?? {
          companion,
          element,
          hitArea,
          exitMargin,
          maxAttraction,
          proximity,
          exiting: false,
          frame: null,
          lastTime: null,
          targetX: 0,
          targetY: 0,
          vx: 0,
          vy: 0,
          x: 0,
          y: 0,
          pressing: false,
          pressOriginX: 0,
          pressOriginY: 0,
          maxTravel: 0,
          press: 0,
          pressV: 0,
          pressTarget: 0,
        };
        targetRef.current.companion = companion;
        targetRef.current.hitArea = hitArea;
        targetRef.current.exitMargin = exitMargin;
        targetRef.current.maxAttraction = maxAttraction;
        targetRef.current.proximity = proximity;
        targetRef.current.exiting = false;
        controllers.add(targetRef.current);
        root.classList.add("ios-pointer-attracting");
      }

      const active = targetRef.current;
      if (!active) return;

      // Menu items use a stationary wrapper for hit testing. Other controls
      // use the moving element itself, so remove its current translate.
      const rect = hitArea.getBoundingClientRect();
      const hitAreaMoves = hitArea === element;
      const centerX = rect.left + rect.width / 2 - (hitAreaMoves ? active.x : 0);
      const centerY = rect.top + rect.height / 2 - (hitAreaMoves ? active.y : 0);
      // Normalize against the target's own bounds before mapping to the fixed
      // travel distance. A wide menu item and a compact icon now feel equally
      // magnetic at the same relative cursor position.
      const relativeX = (clientX - centerX) / Math.max(rect.width / 2, 1);
      const relativeY = (clientY - centerY) / Math.max(rect.height / 2, 1);
      const mappedX = mapAttraction(relativeX, active.maxAttraction);
      const mappedY = mapAttraction(relativeY, active.maxAttraction);
      const left = rect.left - (hitAreaMoves ? active.x : 0);
      const top = rect.top - (hitAreaMoves ? active.y : 0);
      const depth = getAttractionDepth(
        clientX,
        clientY,
        left,
        top,
        rect.width,
        rect.height,
      );
      const outsideDistance = getOutsideDistance(
        clientX,
        clientY,
        left,
        top,
        rect.width,
        rect.height,
      );
      const next = applyAttractionEnvelope(
        mappedX,
        mappedY,
        depth,
        outsideDistance,
        active.proximity,
      );

      active.targetX = next.x;
      active.targetY = next.y;
      if (active.companion) {
        attractCompanion(
          active.companion,
          clientX,
          clientY,
          active.maxAttraction,
          active.proximity,
        );
      }
      startController(active);
    };

    // While the button is held, the active target follows the pointer through a
    // rubber-band that asymptotes at PRESS_MAX_TRAVEL_PX — deforms and shifts
    // toward the cursor, but is physically incapable of being dragged off.
    // Locks onto the pressed element; hover routing is bypassed.
    const updatePressDrag = (active: AttractedTarget, clientX: number, clientY: number) => {
      const dx = clientX - active.pressOriginX;
      const dy = clientY - active.pressOriginY;
      const r = Math.hypot(dx, dy);
      if (r < 1e-4) {
        active.targetX = 0;
        active.targetY = 0;
      } else {
        // Map the drag *magnitude* through the curve (asymptote is a circle of
        // radius PRESS_MAX_TRAVEL_PX, not a per-axis square), pre-scaled by
        // PRESS_RESISTANCE so travel is damped from the first pixel. Rescale
        // the clamped magnitude back onto the original direction.
        const mappedR =
          PRESS_MAX_TRAVEL_PX * Math.tanh((r * PRESS_RESISTANCE) / PRESS_MAX_TRAVEL_PX);
        const scale = mappedR / r;
        active.targetX = dx * scale;
        active.targetY = dy * scale;
      }
      active.maxTravel = Math.max(active.maxTravel, r);
      startController(active);
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;

      const pressed = targetRef.current;
      if (pressed?.pressing) {
        updatePressDrag(pressed, event.clientX, event.clientY);
        return;
      }

      let target = getAttractionTarget(event.target);
      const active = targetRef.current;
      // A MorphMenu shell grows from a compact trigger into the full panel.
      // Retaining it through the generic exit margin would make that entire
      // panel keep following the cursor after expansion.
      const canRetainActiveTarget = !active?.element.matches(".glass-shell");
      if (!target && active?.element.isConnected && canRetainActiveTarget) {
        const rect = active.hitArea.getBoundingClientRect();
        const hitAreaMoves = active.hitArea === active.element;
        const left = rect.left - (hitAreaMoves ? active.x : 0);
        const top = rect.top - (hitAreaMoves ? active.y : 0);
        const outsideDistance = getOutsideDistance(
          event.clientX,
          event.clientY,
          left,
          top,
          rect.width,
          rect.height,
        );
        const insideExitZone =
          outsideDistance <= active.proximity + active.exitMargin;
        if (insideExitZone) {
          target = {
            element: active.element,
            hitArea: active.hitArea,
            exitMargin: active.exitMargin,
            maxAttraction: active.maxAttraction,
            proximity: active.proximity,
          };
        }
      }
      if (!target) {
        target = getProximityTarget(event.clientX, event.clientY);
      }
      if (target) attractTarget(target, event.clientX, event.clientY);
      else clearTarget();
    };

    const onPointerLeave = () => {
      // A held button keeps deforming even if the cursor leaves the window;
      // only release ends it. Idle hover attraction still clears normally.
      if (targetRef.current?.pressing) return;
      clearTarget();
    };

    let suppressClick = false;

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      const target = getAttractionTarget(event.target);
      // Phase 1: only the standalone glass pills deform on press. The nav's
      // selected fill (.site-hover-fill) is handled separately.
      if (!target || target.element.matches(".site-hover-fill")) return;

      attractTarget(target, event.clientX, event.clientY);
      const active = targetRef.current;
      if (!active) return;
      active.pressing = true;
      active.pressOriginX = event.clientX;
      active.pressOriginY = event.clientY;
      active.pressTarget = 1;
      active.maxTravel = 0;
      updatePressDrag(active, event.clientX, event.clientY);
    };

    const endPress = (event: PointerEvent) => {
      const active = targetRef.current;
      if (!active?.pressing) return;
      active.pressing = false;
      active.pressTarget = 0;
      // A meaningful drag shouldn't also fire the control's click/navigation.
      if (active.maxTravel > PRESS_CLICK_CANCEL_PX) suppressClick = true;
      // Hand back to hover routing: re-evaluate the release position so the
      // control eases from its dragged pose to the resting hover offset (or
      // clears if the pointer ended outside).
      onPointerMove(event);
    };

    const onClickCapture = (event: MouseEvent) => {
      if (!suppressClick) return;
      suppressClick = false;
      event.preventDefault();
      event.stopPropagation();
    };

    // Press-drag reads raw pointermove, not Motion's `drag` (which already
    // swallows this). Without it, the browser's native drag-and-drop hijacks
    // the gesture — an <img>/link ghost-drag starts instead of the button
    // deforming. `-webkit-user-drag: none` in CSS covers Blink/WebKit; this
    // covers Firefox (which ignores that property) and any el that slips
    // through the CSS selector scope.
    const onDragStart = (event: DragEvent) => {
      if (!(event.target instanceof Element)) return;
      if (event.target.closest("[data-ios-pointer-target], .site-hover-fill")) {
        event.preventDefault();
      }
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointerup", endPress, { passive: true });
    window.addEventListener("pointercancel", endPress, { passive: true });
    window.addEventListener("click", onClickCapture, true);
    window.addEventListener("dragstart", onDragStart);
    window.addEventListener(IOS_POINTER_CANCEL_ATTRACTION_EVENT, cancelAttraction);

    return () => {
      for (const controller of controllers) finishController(controller);
      for (const controller of companionControllers.values()) {
        finishCompanionController(controller);
      }
      targetRef.current = null;
      root.classList.remove("ios-pointer-ready");
      proximityObserver.disconnect();
      window.removeEventListener("resize", invalidateProximityCandidates);
      window.removeEventListener("scroll", invalidateProximityCandidates, true);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", endPress);
      window.removeEventListener("pointercancel", endPress);
      window.removeEventListener("click", onClickCapture, true);
      window.removeEventListener("dragstart", onDragStart);
      window.removeEventListener(IOS_POINTER_CANCEL_ATTRACTION_EVENT, cancelAttraction);
    };
  }, []);

  return null;
}

