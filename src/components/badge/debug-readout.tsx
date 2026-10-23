"use client";

// TEMPORARY (?badge=debug): an on-screen readout to find what makes the card
// stutter on the visitor's own machine. Remove once the lag's cause is known.

import { useEffect, useState } from "react";
import type * as THREE from "three";

type LongFrame = PerformanceEntry & {
  blockingDuration?: number;
  scripts?: {
    sourceURL?: string;
    sourceFunctionName?: string;
    invoker?: string;
    duration: number;
  }[];
};

type Stats = {
  fps: number;
  worst: number;
  slow: number;
  programs: number;
  dpr: number;
  size: string;
  log: string[];
};

const EVENTS_KEPT = 10;

export function DebugReadout({ gl }: { gl: THREE.WebGLRenderer }) {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    const t0 = performance.now();
    const at = (time: number) => `${((time - t0) / 1000).toFixed(1)}s`;
    const frames: { time: number; dt: number }[] = [];
    const log: string[] = [];
    let slow = 0;
    let programs = gl.info.programs?.length ?? 0;
    let last = t0;
    let raf = 0;
    const push = (line: string) => {
      log.unshift(line);
      log.length = Math.min(log.length, EVENTS_KEPT);
    };

    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      frames.push({ time: now, dt });
      while (frames.length && now - frames[0].time > 5000) frames.shift();
      if (dt > 25) slow++;
      const count = gl.info.programs?.length ?? 0;
      if (count !== programs) {
        push(`${at(now)} shader compile → ${count} programs (frame ${Math.round(dt)}ms)`);
        programs = count;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    let observer: PerformanceObserver | null = null;
    try {
      observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as LongFrame[]) {
          const top = [...(entry.scripts ?? [])].sort((a, b) => b.duration - a.duration)[0];
          const where = top
            ? `${(top.sourceURL ?? "").split("/").pop()}:${top.sourceFunctionName || "?"} via ${top.invoker ?? "?"} ${Math.round(top.duration)}ms`
            : "no script (style/layout/paint)";
          push(`${at(entry.startTime)} long frame ${Math.round(entry.duration)}ms: ${where}`);
        }
      });
      observer.observe({ type: "long-animation-frame", buffered: false });
    } catch {
      push("long-animation-frame not supported in this browser");
    }

    const onDown = (e: PointerEvent) =>
      push(`${at(performance.now())} pointerdown (${e.pointerType})`);
    window.addEventListener("pointerdown", onDown, true);

    const interval = setInterval(() => {
      const now = performance.now();
      const lastSecond = frames.filter((f) => now - f.time <= 1000);
      setStats({
        fps: lastSecond.length,
        worst: Math.round(Math.max(0, ...frames.map((f) => f.dt))),
        slow,
        programs,
        dpr: gl.getPixelRatio(),
        size: `${gl.domElement.width}×${gl.domElement.height}`,
        log: [...log],
      });
    }, 250);

    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      window.removeEventListener("pointerdown", onDown, true);
      clearInterval(interval);
    };
  }, [gl]);

  if (!stats) return null;
  return (
    <div
      style={{
        position: "fixed",
        left: 8,
        bottom: 8,
        zIndex: 1000,
        maxWidth: "min(560px, calc(100vw - 16px))",
        padding: "8px 10px",
        borderRadius: 8,
        background: "rgba(0,0,0,0.82)",
        color: "#fff",
        font: "11px/1.45 ui-monospace, SFMono-Regular, Menlo, monospace",
        pointerEvents: "none",
        whiteSpace: "pre-wrap",
      }}
    >
      {`fps ${stats.fps} · worst frame (5s) ${stats.worst}ms · slow frames ${stats.slow}
shaders ${stats.programs} · dpr ${stats.dpr} · canvas ${stats.size}
${stats.log.join("\n") || "(no events yet)"}`}
    </div>
  );
}
