// The blur-in, as phones play it. Animating a blur is too heavy for phone
// GPUs, so on touch screens without hover (phones, most tablets) text comes
// in line by line instead, and the photo, cards and images fade and rise.
// Only opacity and transform move, which phones animate almost for free.
// Desktops keep the blur at any window width: what matters is the device's
// GPU, not the screen size.

import type { Transition } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1] as const;
// For the fade: eases in as well as out, so things appear gradually instead
// of popping in. That gradual arrival is what the blur used to provide.
const FADE_EASE = [0.33, 0, 0.2, 1] as const;
const RISE_PX = 8;
const RISE_S = 1.2;
const FADE_S = 1.1;
// Pause between one line and the next.
const LINE_STAGGER_MS = 100;

let phoneQuery: MediaQueryList | undefined;

/** Touch screen without hover: gets the phone version of the blur-in. */
export function isPhone() {
  if (typeof window === "undefined") return false;
  phoneQuery ??= matchMedia("(hover: none) and (pointer: coarse)");
  return phoneQuery.matches;
}

/** Photo, cards and images: fade and rise. The blur is dropped while still
 * invisible (the hidden state is shared with desktop). */
export function riseVisible(delay: number) {
  return {
    opacity: [0, 1],
    transform: [`translateY(${RISE_PX}px)`, "translateY(0px)"],
    filter: "none",
    transitionEnd: { transform: "none", willChange: "auto" },
    transition: {
      duration: RISE_S,
      ease: EASE,
      delay,
      opacity: { duration: FADE_S, ease: FADE_EASE, delay },
      filter: { duration: 0 },
    } as Transition,
  };
}

/** Text: the item shows at once and its lines then play (see playLines). */
export function linesVisible(delay: number) {
  return {
    opacity: 1,
    transform: "none",
    filter: "none",
    willChange: "auto",
    transition: { duration: 0.01, delay },
  };
}

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

/** Fades and raises one element after `delay` ms. Returns its animations. */
function rise(element: HTMLElement, delay: number) {
  return [
    element.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: FADE_S * 1000,
      easing: `cubic-bezier(${FADE_EASE.join(", ")})`,
      delay,
      fill: "backwards",
    }),
    element.animate(
      [{ transform: `translateY(${RISE_PX}px)` }, { transform: "translateY(0px)" }],
      {
        duration: RISE_S * 1000,
        easing: `cubic-bezier(${EASE.join(", ")})`,
        delay,
        fill: "backwards",
      },
    ),
  ];
}

/** Plays the item's text line by line. Returns a function that stops it. */
export function playLines(root: HTMLElement) {
  // Items with controls (the call-to-action) play as a single line.
  if (root.querySelector("button")) {
    const only = root.firstElementChild as HTMLElement | null;
    const animations = only ? rise(only, 0) : [];
    return () => animations.forEach((animation) => animation.cancel());
  }
  let line = -1;
  let lastTop = -Infinity;
  const animations = words(root).flatMap((span) => {
    const top = span.getBoundingClientRect().top;
    if (top > lastTop + 2) {
      line++;
      lastTop = top;
    }
    return rise(span, line * LINE_STAGGER_MS);
  });
  return () => animations.forEach((animation) => animation.cancel());
}
