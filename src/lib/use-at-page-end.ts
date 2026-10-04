"use client";

import { useEffect, useState } from "react";

// How close to the bottom (px) counts as the end of the page.
const END_THRESHOLD = 8;

/** True while the page is scrolled to its end. */
export function useAtPageEnd() {
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

  return atEnd;
}
