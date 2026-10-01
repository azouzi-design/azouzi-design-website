"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

// "soft-blur-in": content rises a few px, fades in and sharpens from a soft blur.
const EASE = [0.22, 1, 0.36, 1] as const;
const DURATION = 1.2;
const STAGGER = 0.1;
// Page-load delays only apply while the page is still loading; later replays
// use `replayDelay` instead.
const INITIAL_LOAD_MS = 4000;

type Timing = {
  /** Seconds before playing during the page-load sequence. */
  delay?: number;
  /** Seconds before playing on later replays (e.g. to stagger a row). */
  replayDelay?: number;
  /** Apply `replayDelay` only at or above this viewport width (px). */
  replayDelayMinWidth?: number;
};

function blurVariants(
  reduced: boolean | null,
  { delay = 0, replayDelay = 0, replayDelayMinWidth = 0 }: Timing = {},
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
        delay:
          performance.now() < INITIAL_LOAD_MS
            ? delay
            : window.innerWidth >= replayDelayMinWidth
              ? replayDelay
              : 0,
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
        visible: { transition: { staggerChildren: reduced ? 0 : STAGGER } },
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
  ...timing
}: {
  children: ReactNode;
  className?: string;
  id?: string;
} & Timing) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ amount: 0.3 }}
      variants={blurVariants(reduced, timing)}
    >
      {children}
    </motion.div>
  );
}
