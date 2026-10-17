"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import type { ProjectImage } from "@/lib/projects";

// A small window beside the cursor that flicks through a project's shots
// while its home card is hovered. The card itself doesn't change.
const WIDTH = 400;
// From the cursor to the window's nearest corner.
const OFFSET = 16;
// How long each still stays up.
const STILL_MS = 100;
// Clips are 3s snippets, played this many times faster.
const VIDEO_RATE = 3;

const QUERY =
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)";

/** True where there's a mouse or trackpad and motion is welcome. */
function usePeekAllowed() {
  return useSyncExternalStore(
    (onChange) => {
      const query = window.matchMedia(QUERY);
      query.addEventListener("change", onChange);
      return () => query.removeEventListener("change", onChange);
    },
    () => window.matchMedia(QUERY).matches,
    () => false,
  );
}

/**
 * Rendered inside the card: it listens to the card (its parent) and draws the
 * window in a portal, so the card's clipping and transitions don't touch it.
 * Mouse and trackpad only; phones and reduced motion get nothing.
 */
export function ProjectPeek({ frames }: { frames: ProjectImage[] }) {
  const anchor = useRef<HTMLSpanElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const videos = useRef<(HTMLVideoElement | null)[]>([]);
  const enabled = usePeekAllowed();
  const [hovered, setHovered] = useState(false);
  const [index, setIndex] = useState(0);

  // The tallest frame: what the window needs to fit above the cursor.
  const maxHeight = Math.max(...frames.map((f) => (WIDTH * f.height) / f.width));

  // Follow the cursor. The window sits above-right of it, its bottom edge
  // pinned there, so frames of different heights grow upward and never jump.
  // The side is picked once on entering, so it doesn't flip mid-hover; it
  // goes left near the right edge and below only when there's no room above.
  useEffect(() => {
    const card = anchor.current?.parentElement;
    if (!enabled || !card) return;

    const move = (event: PointerEvent) => {
      const el = cursorRef.current;
      if (el) el.style.translate = `${event.clientX}px ${event.clientY}px`;
    };
    const enter = (event: PointerEvent) => {
      const box = boxRef.current;
      if (box) {
        const left = event.clientX + OFFSET + WIDTH > window.innerWidth;
        const below = event.clientY - OFFSET - maxHeight < 0;
        box.style.left = left ? "" : `${OFFSET}px`;
        box.style.right = left ? `${OFFSET}px` : "";
        box.style.bottom = below ? "" : `${OFFSET}px`;
        box.style.top = below ? `${OFFSET}px` : "";
        box.style.transformOrigin = `${below ? "top" : "bottom"} ${left ? "right" : "left"}`;
      }
      move(event);
      setIndex(0);
      setHovered(true);
    };
    const leave = () => setHovered(false);

    card.addEventListener("pointerenter", enter);
    card.addEventListener("pointermove", move);
    card.addEventListener("pointerleave", leave);
    return () => {
      card.removeEventListener("pointerenter", enter);
      card.removeEventListener("pointermove", move);
      card.removeEventListener("pointerleave", leave);
    };
  }, [enabled, maxHeight]);

  // Stills hold for STILL_MS; clips play through, sped up.
  useEffect(() => {
    if (!hovered) return;
    const next = () => setIndex((i) => (i + 1) % frames.length);
    const video = frames[index].video ? videos.current[index] : null;
    if (!video) {
      const timer = setTimeout(next, STILL_MS);
      return () => clearTimeout(timer);
    }
    video.currentTime = 0;
    video.playbackRate = VIDEO_RATE;
    video.addEventListener("ended", next);
    // Autoplay can be refused; move on rather than stall.
    video.play().catch(next);
    return () => {
      video.removeEventListener("ended", next);
      video.pause();
    };
  }, [hovered, index, frames]);

  // A project with only placeholder blocks has nothing to show.
  if (frames.length === 0) return null;
  const current = frames[index];

  return (
    <span ref={anchor} hidden>
      {enabled &&
        createPortal(
          // A zero-size point at the cursor; the window hangs off one of its
          // corners (set on entering, above).
          <div
            ref={cursorRef}
            aria-hidden
            className="pointer-events-none fixed top-0 left-0 z-50"
          >
            <div
              ref={boxRef}
              className={`absolute overflow-clip rounded-[6px] bg-background-200 shadow-[0_0_0_1px_rgba(0,0,0,0.04)] transition-[opacity,scale] duration-150 ease-out ${hovered ? "scale-100 opacity-100" : "scale-90 opacity-0"}`}
              style={{
                width: WIDTH,
                aspectRatio: `${current.width} / ${current.height}`,
              }}
            >
              {/* Every frame is mounted (and loaded) up front, so the flicking
                  never waits on the network; only the current one shows. */}
              {frames.map((frame, i) => {
                const className = `absolute inset-0 size-full object-cover ${i === index ? "" : "invisible"}`;
                return frame.video ? (
                  <video
                    key={frame.src}
                    ref={(el) => {
                      videos.current[i] = el;
                    }}
                    src={frame.src}
                    muted
                    playsInline
                    preload="auto"
                    className={className}
                  />
                ) : (
                  <img
                    key={frame.src}
                    src={frame.src}
                    alt=""
                    decoding="async"
                    className={className}
                  />
                );
              })}
            </div>
          </div>,
          document.body,
        )}
    </span>
  );
}
