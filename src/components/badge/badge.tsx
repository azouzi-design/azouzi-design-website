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

// Module-level so it survives client-side navigation: leaving the home page
// unmounts the badge, and coming back must not replay the entrance. Resets on
// a full page load.
let entrancePlayed = false;

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
  // Entrance already seen this visit: the card starts hanging at rest.
  const [startAtRest] = useState(() => entrancePlayed);
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

  // Play the entrance the first time the badge scrolls into view only. Later
  // scroll-ins just resume the scene (it's paused while off-screen).
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let visible = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting === visible) return;
        visible = entry.isIntersecting;
        setActive(visible);
        if (visible && !entrancePlayed) {
          entrancePlayed = true;
          setPlayKey((key) => key + 1);
        }
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
      // Full-bleed: cancels the app shell's side padding (px-3 md:px-4) so the
      // canvas reaches the screen edges. Otherwise the card's shadow, which
      // falls to the right, is cut off in a hard line before the edge.
      className="-mx-3 md:-mx-4"
      style={{ height: getCardLayout(portrait).areaHeightPx }}
    >
      {lowPower !== null && (
        <Lanyard
          playKey={playKey}
          active={active}
          portrait={portrait}
          lowPower={lowPower}
          startAtRest={startAtRest}
        />
      )}
    </section>
  );
}
