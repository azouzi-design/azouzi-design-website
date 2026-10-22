import type { CSSProperties } from "react";

// Grey dotted links are the clickable text elements across the site.
export const linkClasses =
  "cursor-pointer font-semibold text-gray-700 underline decoration-dotted decoration-current/70 decoration-[10%] underline-offset-4 transition-colors duration-150 hover:text-gray-1000 active:opacity-70";

// The site's button size, type and press. The variants below add the shape
// and fill.
const buttonBase =
  "flex h-10 shrink-0 cursor-pointer items-center justify-center gap-1.5 px-3 text-[15px] leading-[normal] font-medium tracking-[-0.15px] whitespace-nowrap text-gray-1000 transition-[scale,background-color,border-color] duration-200 ease-out active:scale-[0.97] active:duration-100";

// The site's button: white with a stroke and 12px corners (About & Services,
// Contact me, Return Home). Hover: the barest grey.
export const outlineButtonClasses = `${buttonBase} rounded-[12px] border border-stroke bg-background-100 hover:bg-[color-mix(in_srgb,var(--ds-background-100),var(--ds-gray-1000)_1.5%)]`;

// Buttons that blur in (add the .button-appear class, see globals.css) do so
// one after another, this far apart.
const APPEAR_START_MS = 200;
const APPEAR_STEP_MS = 60;

/** Style giving the nth .button-appear button its entrance delay. */
export function appearAfter(n: number) {
  return { "--appear-delay": `${APPEAR_START_MS + n * APPEAR_STEP_MS}ms` } as CSSProperties;
}
