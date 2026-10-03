"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { PORTRAIT_MAX_WIDTH, getCardLayout } from "./lanyard-layout";

// WebGL + Rapier (WASM) are browser-only.
const Lanyard = dynamic(() => import("./lanyard"), { ssr: false });

// The throw starts once this much of the badge area's top is on screen.
const TRIGGER_PX = 200;

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
      <Lanyard playKey={playKey} active={active} portrait={portrait} />
    </section>
  );
}
