"use client";

import dynamic from "next/dynamic";
import { useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { isLowPower } from "@/lib/low-power";

// WebGL is browser-only.
const Scene = dynamic(() => import("./scene"), { ssr: false });

/**
 * The /concept page's project media, shaped by a scroll effect as they come
 * in (`effect`, from effects.ts; Bend by default). A fixed canvas over the content, under the bars.
 * Skipped with reduced motion or on low-power devices, where the media simply
 * stay as they are.
 */
export function MediaEffects({ effect }: { effect?: string }) {
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = useState(false);

  // Decided after the first frames, once low power can be judged.
  useEffect(() => {
    const timer = setTimeout(() => setEnabled(!isLowPower()), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (reduced || !enabled) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40">
      <Scene effect={effect} />
    </div>
  );
}
