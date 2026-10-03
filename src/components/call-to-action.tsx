"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { linkClasses } from "@/lib/styles";

const EMAIL = "hello@azouzi.design";
const CONFIRMATION_MS = 1800;

// Same soft blur as the page-load animation: the line blurs out upwards and
// the confirmation blurs in from below, then they swap back.
function swapVariants(reduced: boolean | null, offset: number): Variants {
  if (reduced) {
    return {
      shown: { opacity: 1, transition: { duration: 0.2 } },
      hidden: { opacity: 0, transition: { duration: 0.2 } },
    };
  }
  return {
    shown: {
      opacity: 1,
      transform: "translateY(0px)",
      filter: "blur(0px)",
      transition: { duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] },
    },
    hidden: {
      opacity: 0,
      transform: `translateY(${offset}px)`,
      filter: "blur(6px)",
      transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
    },
  };
}

export function CallToAction() {
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const reduced = useReducedMotion();

  useEffect(() => () => clearTimeout(timer.current), []);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(EMAIL);
    } catch {
      // Clipboard API unavailable — nothing sensible to fall back to.
      return;
    }
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), CONFIRMATION_MS);
  }

  return (
    <div className="flex items-center gap-2">
      {/* Both states share one grid cell, so the line never changes size. */}
      <p className="grid whitespace-nowrap">
        <motion.span
          className="[grid-area:1/1]"
          variants={swapVariants(reduced, -6)}
          initial={false}
          animate={copied ? "hidden" : "shown"}
          style={{ pointerEvents: copied ? "none" : "auto" }}
          aria-hidden={copied}
        >
          <a
            href="https://cal.com/azouzi-design/30min"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClasses}
          >
            Book a call
          </a>{" "}
          or{" "}
          <button type="button" onClick={handleCopy} className={linkClasses}>
            Copy Email
          </button>
        </motion.span>
        <motion.span
          className="pointer-events-none text-center font-semibold text-gray-700 [grid-area:1/1]"
          variants={swapVariants(reduced, 6)}
          initial={false}
          animate={copied ? "shown" : "hidden"}
          aria-hidden
        >
          Copied to clipboard
        </motion.span>
        <span className="sr-only" role="status">
          {copied ? "Copied to clipboard" : ""}
        </span>
      </p>
      <motion.span
        className="flex h-4 items-center whitespace-nowrap rounded-[2px] bg-gray-700 px-1 text-[12px] leading-none font-medium tracking-[-0.06px] text-background-100"
        // A quick playful shake on hover (skipped with reduced motion).
        whileHover={
          reduced
            ? undefined
            : {
                x: [0, -2, 2, -1.5, 1.5, 0],
                rotate: [0, -3, 3, -2, 2, 0],
                transition: { duration: 0.5, ease: "easeInOut" },
              }
        }
      >
        1/2 Spots left
      </motion.span>
    </div>
  );
}
