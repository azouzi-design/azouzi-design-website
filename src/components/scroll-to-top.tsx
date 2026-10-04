"use client";

import { useEffect, useState } from "react";
import { pillClasses } from "@/lib/styles";

// How close to the bottom (px) counts as the end of the page.
const END_THRESHOLD = 8;

/** Home page: once scrolled to the end, a button in the corner goes back up. */
export function ScrollToTop() {
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    function update() {
      const { scrollHeight } = document.documentElement;
      setAtEnd(window.scrollY + window.innerHeight >= scrollHeight - END_THRESHOLD);
    }
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

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
