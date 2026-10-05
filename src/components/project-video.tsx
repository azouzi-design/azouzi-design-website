"use client";

import { useEffect, useRef, useState } from "react";
import type { ProjectImage } from "@/lib/projects";

/**
 * A project clip: silent and looping, like a moving screenshot. It only loads
 * once it nears the screen and only plays while on it. With reduced motion it
 * stays paused, with controls to play it on demand.
 */
export function ProjectVideo({ video }: { video: ProjectImage }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(reduceMotion.matches);
    if (reduceMotion.matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // Autoplay can be refused (e.g. low-power mode); it stays paused.
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      // Start a little before it scrolls in, so it is already moving.
      { rootMargin: "200px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={video.src}
      width={video.width}
      height={video.height}
      aria-label={video.alt}
      muted
      loop
      playsInline
      preload={reduced ? "metadata" : "none"}
      controls={reduced}
      className="block h-auto w-full bg-background-200"
    />
  );
}
