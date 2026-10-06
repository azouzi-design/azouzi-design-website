"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useRef, type ReactNode } from "react";
import {
  isPhone,
  linesVisible,
  playLines,
  riseVisible,
} from "@/components/phone-motion";
import { playSend } from "@/lib/sounds";

// "soft-blur-in": content rises a few px, fades in and sharpens from a soft blur.
// Phones play a version without the blur (see phone-motion.ts).
const EASE = [0.22, 1, 0.36, 1] as const;
const DURATION = 1.2;
// Moved with `transform` rather than Framer's `y`: transform runs on the
// compositor, `y` is recalculated on the main thread every frame.
const RISE = "translateY(8px)";
export const STAGGER = 0.1;
// Pause before a text block starts playing, every time it comes into view.
export const TEXT_DELAY = 0.8;
// Page-load delays only apply while the page is still loading; later replays
// use `replayDelay` instead.
const INITIAL_LOAD_MS = 4000;
// Seconds the <main> reveal (.main-reveal in globals.css) takes before any
// content starts, on page load only.
const INTRO_DELAY = 1.1;

// After a client-side navigation (opening or closing a project), content
// starts while the project card is mid-flight (it takes 650ms, see "Project
// transitions" in globals.css), so the page settles as the card lands.
const NAV_DELAY = 0.3;
// How long after a navigation its timing applies; later scroll-ins replay.
const NAV_WINDOW_MS = 1500;

// Flips once the first page has hydrated. Anything that mounts after that is
// the result of a client-side navigation.
let appHydrated = false;
export function markAppHydrated() {
  appHydrated = true;
}

let navigatedAt: number | null = null;
/** Called on every client-side route change. */
export function markNavigation() {
  navigatedAt = performance.now();
  // Sounds still waiting for a page that has just been left.
  pendingSounds.forEach(clearTimeout);
  pendingSounds.clear();
}

/** Seconds before content plays during the page-load sequence. */
function loadDelay(delay = 0) {
  return delay + INTRO_DELAY;
}

const pendingSounds = new Set<ReturnType<typeof setTimeout>>();

/**
 * The "Send" sound for something that blurs in during the page-load sequence,
 * timed to land as it appears. Later replays (scrolling back, navigating) are
 * silent.
 */
function soundOnLoad(delay: number) {
  if (phase() !== "load") return;
  const timer = setTimeout(() => {
    pendingSounds.delete(timer);
    playSend();
  }, loadDelay(delay) * 1000);
  pendingSounds.add(timer);
}

/** Which timing applies to content that is about to play. */
function phase(): "load" | "navigation" | "replay" {
  const now = performance.now();
  if (navigatedAt === null) return now < INITIAL_LOAD_MS ? "load" : "replay";
  return now - navigatedAt < NAV_WINDOW_MS ? "navigation" : "replay";
}

type Timing = {
  /** Seconds before playing during the page-load sequence. */
  delay?: number;
  /** Seconds after NAV_DELAY, to order it within a navigation. */
  navOffset?: number;
  /** Seconds before playing on later replays (e.g. to stagger a row). */
  replayDelay?: number;
  /** Apply `replayDelay` only at or above this viewport width (px). */
  replayDelayMinWidth?: number;
  /** Never part of the page-load or navigation sequence: always plays with
   * `replayDelay` as it scrolls in, however soon after the page opened. */
  scrollOnly?: boolean;
};

function blurVariants(
  reduced: boolean | null,
  {
    delay = 0,
    navOffset = 0,
    replayDelay = 0,
    replayDelayMinWidth = 0,
    scrollOnly = false,
  }: Timing = {},
  /** A text item (SoftBlurItem): played line by line on phones. */
  text = false,
): Variants {
  // Reduced motion: keep a plain fade, drop the movement and blur.
  if (reduced) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.3 } },
    };
  }
  return {
    // While hidden, will-change has the browser set up each element's GPU layer
    // ahead of time (during the pause before it plays), instead of setting up
    // every layer in the animation's first frame, which stalls it on phones.
    hidden: {
      opacity: 0,
      transform: RISE,
      filter: "blur(8px)",
      willChange: "opacity, transform, filter",
    },
    visible: () => {
      const start = (() => {
        switch (scrollOnly ? "replay" : phase()) {
          case "load":
            return loadDelay(delay);
          case "navigation":
            return NAV_DELAY + navOffset;
          default:
            return window.innerWidth >= replayDelayMinWidth ? replayDelay : 0;
        }
      })();
      if (isPhone()) return text ? linesVisible(start) : riseVisible(start);
      return {
        opacity: 1,
        transform: "translateY(0px)",
        filter: "blur(0px)",
        // Once settled, release the layer and the no-op filter and transform.
        transitionEnd: { filter: "none", transform: "none", willChange: "auto" },
        transition: { duration: DURATION, ease: EASE, delay: start },
      };
    },
  };
}

/** Plays its SoftBlurItem children, in order, each time it scrolls into view. */
export function SoftBlurIn({
  children,
  className,
  sound,
}: {
  children: ReactNode;
  className?: string;
  /** Play "Send" as its text appears during the page-load sequence. The items
   * all start together (each one's own delay wins over the group's), so it is
   * one sound for the block. */
  sound?: boolean;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      onViewportEnter={sound ? () => soundOnLoad(0) : undefined}
      viewport={{ amount: 0.3 }}
      variants={{
        hidden: {},
        visible: () => ({
          transition: {
            delayChildren: (() => {
              switch (phase()) {
                case "load":
                  return TEXT_DELAY + (reduced ? 0 : INTRO_DELAY);
                case "navigation":
                  return NAV_DELAY;
                default:
                  return TEXT_DELAY;
              }
            })(),
            staggerChildren: reduced ? 0 : STAGGER,
          },
        }),
      }}
    >
      {children}
    </motion.div>
  );
}

export function SoftBlurItem({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const stopLines = useRef<(() => void) | null>(null);
  // Phones: the item shows at once, then its lines play. Leaving the screen
  // stops them, so they replay on the way back.
  const lines = !reduced && isPhone();
  return (
    <motion.div
      ref={ref}
      variants={blurVariants(reduced, {}, true)}
      onUpdate={
        lines
          ? (latest) => {
              const opacity = Number(latest.opacity);
              if (opacity > 0 && !stopLines.current && ref.current) {
                stopLines.current = playLines(ref.current);
              } else if (opacity === 0 && stopLines.current) {
                stopLines.current();
                stopLines.current = null;
              }
            }
          : undefined
      }
    >
      {children}
    </motion.div>
  );
}

/**
 * Plays each time it scrolls into view. `delay` orders it within the
 * page-load sequence; `replayDelay` staggers it on later replays.
 */
export function SoftBlurView({
  children,
  className,
  id,
  skipOnNavigation,
  once = false,
  sound,
  ...timing
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Mount already visible after a client-side navigation, so a shared
   * element arriving from another page isn't hidden mid-transition. */
  skipOnNavigation?: boolean;
  /** Play the first time it scrolls into view, then stay visible. */
  once?: boolean;
  /** Play "Send" as it appears during the page-load sequence. */
  sound?: boolean;
} & Timing) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      id={id}
      className={className}
      initial={skipOnNavigation && appHydrated ? false : "hidden"}
      whileInView="visible"
      onViewportEnter={sound ? () => soundOnLoad(timing.delay ?? 0) : undefined}
      viewport={{ amount: 0.3, once }}
      variants={blurVariants(reduced, timing)}
    >
      {children}
    </motion.div>
  );
}
