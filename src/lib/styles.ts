import type { CSSProperties } from "react";

// Grey dotted links are the clickable text elements across the site.
export const linkClasses =
  "cursor-pointer font-semibold text-gray-700 underline decoration-dotted decoration-current/70 decoration-[10%] underline-offset-4 transition-colors duration-150 hover:text-gray-1000 active:opacity-70";

// The site's button size, type and press. The variants below add the shape
// and fill.
const buttonBase =
  "flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 px-3 text-[15px] leading-[normal] font-medium tracking-[-0.15px] whitespace-nowrap text-gray-1000 transition-[scale,background-color,border-color] duration-200 ease-out active:scale-[0.97] active:duration-100";

// White pill buttons: scroll to top, and the project page header's links.
export const pillClasses = `${buttonBase} rounded-full bg-background-100`;

// A stroked button with no fill and 12px corners (the /concept page's top
// buttons). Hover: the barest tint.
export const outlineButtonClasses = `${buttonBase} rounded-[12px] border border-stroke hover:bg-gray-1000/[0.015]`;

// Buttons that blur in like the project pages' header buttons (add the
// .button-appear class, see globals.css) do so one after another, this far
// apart.
const APPEAR_START_MS = 200;
const APPEAR_STEP_MS = 60;

/** Style giving the nth .button-appear button its entrance delay. */
export function appearAfter(n: number) {
  return { "--appear-delay": `${APPEAR_START_MS + n * APPEAR_STEP_MS}ms` } as CSSProperties;
}
