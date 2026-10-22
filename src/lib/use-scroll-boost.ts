"use client";

import { useEffect } from "react";

// How much of the remaining distance each frame covers: high enough that the
// page keeps up with a trackpad's own momentum, low enough to smooth a wheel.
const EASE = 0.25;

/**
 * Makes wheel and trackpad scrolling go `boost` times as far, eased so the
 * extra distance doesn't jump. Only vertical wheel input is taken over:
 * horizontal swipes (the browser's back gesture), pinch-zoom (ctrl+wheel),
 * keyboard, scrollbar and touch scrolling stay native. With reduced motion
 * the boost applies without the easing. Off while `enabled` is false.
 */
export function useScrollBoost(boost: number, enabled = true) {
  useEffect(() => {
    if (!enabled) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let target = window.scrollY;
    let frame = 0;

    const maxScroll = () => document.documentElement.scrollHeight - window.innerHeight;

    // Where this last scrolled the page, to notice anything else scrolling it.
    let expected = window.scrollY;

    const step = () => {
      const y = window.scrollY;
      // Something else moved the page (a jump to the top, a link, the
      // keyboard): let it, and stop easing.
      if (Math.abs(y - expected) > 2) {
        frame = 0;
        return;
      }
      // The page only lands on whole pixels, so "there" means within 1px.
      if (Math.abs(target - y) < 1) {
        window.scrollTo(0, target);
        frame = 0;
        return;
      }
      expected = y + (target - y) * EASE;
      window.scrollTo(0, expected);
      frame = requestAnimationFrame(step);
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
      // Lines or pages, for wheels that report them, to px.
      const unit =
        event.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : event.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? window.innerHeight
            : 1;
      event.preventDefault();
      // Not mid-ease: start from wherever the page is now (it may have been
      // scrolled some other way since).
      if (!frame) target = window.scrollY;
      target = Math.round(
        Math.min(Math.max(target + event.deltaY * unit * boost, 0), maxScroll()),
      );
      if (reduced) window.scrollTo(0, target);
      else if (!frame) {
        expected = window.scrollY;
        frame = requestAnimationFrame(step);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.removeEventListener("wheel", onWheel);
      cancelAnimationFrame(frame);
    };
  }, [boost, enabled]);
}
