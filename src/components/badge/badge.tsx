"use client";

import dynamic from "next/dynamic";
import { LANYARD_HEIGHT_PX } from "./lanyard-layout";

// WebGL + Rapier (WASM) are browser-only.
const Lanyard = dynamic(() => import("./lanyard"), { ssr: false });

export function Badge() {
  return (
    <div style={{ height: LANYARD_HEIGHT_PX }}>
      <Lanyard />
    </div>
  );
}
