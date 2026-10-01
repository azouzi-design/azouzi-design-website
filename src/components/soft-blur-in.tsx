"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

// "soft-blur-in": content rises a few px, fades in and sharpens from a soft blur.
const EASE = [0.22, 1, 0.36, 1] as const;
const DURATION = 1.2;
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
};

function blurVariants(
  reduced: boolean | null,
  {
    delay = 0,
    navOffset = 0,
    replayDelay = 0,
    replayDelayMinWidth = 0,
  }: Timing = {},
): Variants {
  // Reduced motion: keep a plain fade, drop the movement and blur.
  if (reduced) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.3 } },
    };
  }
  return {
    hidden: { opacity: 0, y: 8, filter: "blur(8px)" },
    visible: () => ({
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        duration: DURATION,
        ease: EASE,
        delay: (() => {
          switch (phase()) {
            case "load":
              return delay + INTRO_DELAY;
            case "navigation":
              return NAV_DELAY + navOffset;
            default:
              return window.innerWidth >= replayDelayMinWidth ? replayDelay : 0;
          }
        })(),
      },
    }),
  };
}

/** Plays its SoftBlurItem children, in order, each time it scrolls into view. */
export function SoftBlurIn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
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
  return <motion.div variants={blurVariants(reduced)}>{children}</motion.div>;
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
  ...timing
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  /** Mount already visible after a client-side navigation, so a shared
   * element arriving from another page isn't hidden mid-transition. */
  skipOnNavigation?: boolean;
} & Timing) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      id={id}
      className={className}
      initial={skipOnNavigation && appHydrated ? false : "hidden"}
      whileInView="visible"
      viewport={{ amount: 0.3 }}
      variants={blurVariants(reduced, timing)}
    >
      {children}
    </motion.div>
  );
}
