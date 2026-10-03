"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { isLowPower } from "@/lib/low-power";
import { PORTRAIT_MAX_WIDTH, getCardLayout } from "./lanyard-layout";

// WebGL + Rapier (WASM) are browser-only.
const Lanyard = dynamic(() => import("./lanyard"), { ssr: false });

// The throw starts once this much of the badge area's top is on screen.
const TRIGGER_PX = 200;
// Building the 3D scene (three.js, physics WASM, textures, shader compiles)
// is heavy work that would compete with the page-load animations, so it waits
// until they've played (ms since the page started loading) and the browser is
// idle. It only starts sooner if the badge gets this close to the screen.
const INTRO_END_MS = 4000;
const PRELOAD_MARGIN_PX = 300;

const NARROW_QUERY = `(max-width: ${PORTRAIT_MAX_WIDTH}px)`;

/** True on narrow screens, where the upright card is used. */
function useNarrowScreen() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(NARROW_QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(NARROW_QUERY).matches,
    () => false,
  );
}

export function Badge() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);
  const [playKey, setPlayKey] = useState(0);
  const portrait = useNarrowScreen();
  // null until the scene may be built; then whether to build its lighter version.
  const [lowPower, setLowPower] = useState<boolean | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const build = () => setLowPower((current) => current ?? isLowPower());
    let idle = 0;
    const timer = setTimeout(() => {
      // Not in older Safari: there, build right after the intro.
      if ("requestIdleCallback" in window) {
        idle = requestIdleCallback(build, { timeout: 1000 });
      } else build();
    }, INTRO_END_MS - performance.now());
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) build();
      },
      { rootMargin: `0px 0px ${PRELOAD_MARGIN_PX}px 0px` },
    );
    observer.observe(element);
    return () => {
      clearTimeout(timer);
      if (idle) cancelIdleCallback(idle);
      observer.disconnect();
    };
  }, []);

  // Replay the entrance every time the badge scrolls into view.
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let visible = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting === visible) return;
        visible = entry.isIntersecting;
        setActive(visible);
        if (visible) setPlayKey((key) => key + 1);
      },
      { rootMargin: `0px 0px -${TRIGGER_PX}px 0px` },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="business-card"
      aria-label="Business card"
      ref={ref}
      style={{ height: getCardLayout(portrait).areaHeightPx }}
    >
      {lowPower !== null && (
        <Lanyard
          playKey={playKey}
          active={active}
          portrait={portrait}
          lowPower={lowPower}
        />
      )}
    </section>
  );
}
