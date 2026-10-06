// TEMP: two alternatives to the blur-in on phones, to compare on a real device.
// Home page, touch screens only; desktop and normal visits keep the blur.
//   ?motion=b    fade + rise + slight scale, no blur
//   ?motion=c    text comes in line by line, no blur (photo and cards as in b)
//   ?motion=off  back to the blur
// The choice is remembered for the session so it survives navigating around.

import type { Transition } from "framer-motion";

const KEY = "motion-trial";
const EASE = [0.22, 1, 0.36, 1] as const;

export type Trial = "b" | "c";

export function phoneTrial(): Trial | null {
  if (typeof window === "undefined") return null;
  let choice: string | null = null;
  try {
    const param = new URLSearchParams(location.search).get("motion");
    if (param === "off") sessionStorage.removeItem(KEY);
    else if (param === "b" || param === "c") sessionStorage.setItem(KEY, param);
    choice = sessionStorage.getItem(KEY);
  } catch {
    // Storage blocked: the URL alone decides.
    choice = new URLSearchParams(location.search).get("motion");
  }
  if (choice !== "b" && choice !== "c") return null;
  if (location.pathname !== "/") return null;
  if (!matchMedia("(hover: none) and (pointer: coarse)").matches) return null;
  return choice;
}

/** B: fade + rise + slight scale. The blur is dropped while still invisible. */
export function softRiseVisible(delay: number) {
  return {
    opacity: [0, 1],
    transform: ["translateY(12px) scale(0.98)", "translateY(0px) scale(1)"],
    filter: "none",
    transitionEnd: { transform: "none", willChange: "auto" },
    transition: {
      duration: 1.2,
      ease: EASE,
      delay,
      // A gentler curve than the rise, so the fade lingers a little.
      opacity: { duration: 1, ease: [0.25, 0.1, 0.25, 1], delay },
      filter: { duration: 0 },
    } as Transition,
  };
}

/** C: the item itself appears at once; its lines then animate (playLines). */
export function linesVisible(delay: number) {
  return {
    opacity: 1,
    transform: "none",
    filter: "none",
    willChange: "auto",
    transition: { duration: 0.01, delay },
  };
}

const LINE_STAGGER_MS = 70;
const LINE_MS = 900;

// Words are wrapped once and kept: the text never changes, and putting the
// original nodes back could re-break the lines and make the block jump.
const wrapped = new WeakMap<HTMLElement, HTMLElement[]>();

function words(root: HTMLElement) {
  const cached = wrapped.get(root);
  if (cached) return cached;
  const texts: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) texts.push(walker.currentNode as Text);
  const spans: HTMLElement[] = [];
  for (const text of texts) {
    if (!text.nodeValue?.trim()) continue;
    const fragment = document.createDocumentFragment();
    for (const part of text.nodeValue.split(/(\s+)/)) {
      if (!part) continue;
      if (/^\s+$/.test(part)) {
        fragment.append(part);
      } else {
        const span = document.createElement("span");
        span.textContent = part;
        span.style.display = "inline-block";
        fragment.append(span);
        spans.push(span);
      }
    }
    text.replaceWith(fragment);
  }
  wrapped.set(root, spans);
  return spans;
}

/** Plays the item's text line by line. Returns a way to stop it. */
export function playLines(root: HTMLElement) {
  const keyframes = [
    { opacity: 0, transform: "translateY(10px)" },
    { opacity: 1, transform: "translateY(0px)" },
  ];
  const options = {
    duration: LINE_MS,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
    fill: "backwards" as const,
  };
  // Items with controls (the call-to-action) play as a single line.
  if (root.querySelector("button")) {
    const only = root.firstElementChild as HTMLElement | null;
    const animation = only?.animate(keyframes, options);
    return () => animation?.cancel();
  }
  const spans = words(root);
  let line = -1;
  let lastTop = -Infinity;
  const animations = spans.map((span) => {
    const top = span.getBoundingClientRect().top;
    if (top > lastTop + 2) {
      line++;
      lastTop = top;
    }
    return span.animate(keyframes, { ...options, delay: line * LINE_STAGGER_MS });
  });
  return () => animations.forEach((animation) => animation.cancel());
}
