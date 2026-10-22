"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { CANVAS_HEIGHT, CANVAS_WIDTH, LOGO_HEIGHT, LOGO_WIDTH, PHONE_LOGO_HEIGHT, PHONE_QUERY } from "./size";

// WebGL is browser-only.
const Scene = dynamic(() => import("./scene"), { ssr: false });

// Phone sizes, scaled from the desktop ones.
const PHONE_SCALE = PHONE_LOGO_HEIGHT / LOGO_HEIGHT;

/** True on phone-width screens (PHONE_QUERY); false on the server. */
function usePhone() {
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(PHONE_QUERY);
    const update = () => setPhone(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return phone;
}

// The header camera's field of view (degrees): narrow, so the camera sits far
// back and the letters keep their proportions as they turn.
const HEADER_FOV = 6;

/**
 * The header's name logo as extruded 3D letters in grey enamel, swaying and
 * leaning toward the pointer. The flat SVG holds its place (and shows until the scene is up,
 * or if WebGL isn't available); the canvas sits centered over it, larger so
 * the turning letters never clip.
 */
export function NameLogo3D() {
  const reduced = useReducedMotion() ?? false;
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);
  const phone = usePhone();

  // Sized in CSS, so phones get the smaller logo from the first paint.
  const sizes = {
    "--logo-w": `${LOGO_WIDTH}px`,
    "--logo-h": `${LOGO_HEIGHT}px`,
    "--phone-logo-w": `${LOGO_WIDTH * PHONE_SCALE}px`,
    "--phone-logo-h": `${PHONE_LOGO_HEIGHT}px`,
    "--canvas-w": `${CANVAS_WIDTH}px`,
    "--canvas-h": `${CANVAS_HEIGHT}px`,
    "--phone-canvas-w": `${CANVAS_WIDTH * PHONE_SCALE}px`,
    "--phone-canvas-h": `${CANVAS_HEIGHT * PHONE_SCALE}px`,
  } as CSSProperties;

  return (
    <span
      className="relative block h-(--phone-logo-h) w-(--phone-logo-w) sm:h-(--logo-h) sm:w-(--logo-w)"
      style={sizes}
    >
      <img
        src="/images/name-logo.svg"
        alt=""
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        // The artwork is a light grey; darkened to the 3D logo's steel so the
        // handover doesn't jump.
        className={`block size-full brightness-[0.72] transition-opacity duration-300 ${ready ? "opacity-0" : ""}`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute top-1/2 left-1/2 h-(--phone-canvas-h) w-(--phone-canvas-w) -translate-1/2 transition-opacity duration-300 sm:h-(--canvas-h) sm:w-(--canvas-w) ${ready ? "" : "opacity-0"}`}
      >
        {/* A narrow view (near face-on, no stretching) and supersampling keep
            the pixel font's small steps clean as it turns. */}
        <Scene
          look="enamel"
          logoHeight={phone ? PHONE_LOGO_HEIGHT : LOGO_HEIGHT}
          fov={HEADER_FOV}
          supersample
          reduced={reduced}
          onReady={onReady}
        />
      </span>
    </span>
  );
}
