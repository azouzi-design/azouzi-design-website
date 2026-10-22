"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import { useCallback, useState } from "react";
import { CANVAS_HEIGHT, CANVAS_WIDTH, LOGO_HEIGHT, LOGO_WIDTH } from "./size";

// WebGL is browser-only.
const Scene = dynamic(() => import("./scene"), { ssr: false });

/**
 * The header's name logo as extruded 3D letters that sway and lean toward
 * the pointer. The flat SVG holds its place (and shows until the scene is up,
 * or if WebGL isn't available); the canvas sits centered over it, larger so
 * the turning letters never clip.
 */
export function NameLogo3D() {
  const reduced = useReducedMotion() ?? false;
  const [ready, setReady] = useState(false);
  const onReady = useCallback(() => setReady(true), []);

  return (
    <span className="relative block" style={{ width: LOGO_WIDTH, height: LOGO_HEIGHT }}>
      <img
        src="/images/name-logo.svg"
        alt=""
        width={LOGO_WIDTH}
        height={LOGO_HEIGHT}
        className={`block transition-opacity duration-300 ${ready ? "opacity-0" : ""}`}
      />
      <span
        aria-hidden
        className={`pointer-events-none absolute top-1/2 left-1/2 -translate-1/2 transition-opacity duration-300 ${ready ? "" : "opacity-0"}`}
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      >
        <Scene logoHeight={LOGO_HEIGHT} reduced={reduced} onReady={onReady} />
      </span>
    </span>
  );
}
