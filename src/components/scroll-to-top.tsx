"use client";

import { pillClasses } from "@/lib/styles";
import { useAtPageEnd } from "@/lib/use-at-page-end";

/** Home page: once scrolled to the end, a button in the corner goes back up. */
export function ScrollToTop() {
  const atEnd = useAtPageEnd();

  function scrollToTop() {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduced ? "auto" : "smooth" });
  }

  return (
    // The wrapper fades; the button presses exactly like the other pills.
    <div
      aria-hidden={!atEnd}
      className={`fixed right-4 bottom-4 z-50 transition-[opacity,translate,filter] duration-300 ease-out ${
        atEnd
          ? "opacity-100"
          : "pointer-events-none translate-y-2 opacity-0 blur-[4px]"
      }`}
    >
      <button
        type="button"
        onClick={scrollToTop}
        tabIndex={atEnd ? 0 : -1}
        className={pillClasses}
      >
        Scroll Top
        <img src="/icons/arrow-corner-right-up.svg" alt="" width={18} height={18} />
      </button>
    </div>
  );
}
