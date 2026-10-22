"use client";

import { useLoader } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { SVG_HEIGHT, SVG_WIDTH } from "./size";

export const SRC = "/images/name-logo.svg";

// The artwork is drawn on a grid of COLS x ROWS square-ish pixels.
export const COLS = 149;
export const ROWS = 14;
export const CELL_X = SVG_WIDTH / COLS;
export const CELL_Y = SVG_HEIGHT / ROWS;

const EXTRUDE = { bevelThickness: 0.4, bevelSize: 0.15, bevelSegments: 2, curveSegments: 4 };

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2);
export const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);

/** Window-wide pointer: -1..1 on each axis from the screen center, plus its
 * position in px. */
export function usePointer() {
  const pointer = useRef({ x: 0, y: 0, clientX: 0, clientY: 0, active: false });
  useEffect(() => {
    const move = (event: PointerEvent) => {
      const current = pointer.current;
      current.x = (event.clientX / window.innerWidth) * 2 - 1;
      current.y = (event.clientY / window.innerHeight) * 2 - 1;
      current.clientX = event.clientX;
      current.clientY = event.clientY;
      current.active = true;
    };
    const leave = () => {
      pointer.current.active = false;
    };
    window.addEventListener("pointermove", move);
    document.documentElement.addEventListener("pointerleave", leave);
    return () => {
      window.removeEventListener("pointermove", move);
      document.documentElement.removeEventListener("pointerleave", leave);
    };
  }, []);
  return pointer;
}

function useSvg() {
  return useLoader(SVGLoader, SRC);
}

/** The artwork's paths pushed back into letters, optionally with a soft edge. */
export function useExtruded(depth: number, bevel = false) {
  const svg = useSvg();
  const geometry = useMemo(() => {
    const shapes = svg.paths.flatMap((path) => SVGLoader.createShapes(path));
    return new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: bevel, ...EXTRUDE });
  }, [svg, depth, bevel]);
  useEffect(() => () => geometry.dispose(), [geometry]);
  return geometry;
}

/** One extruded geometry per letter (each path of the artwork is a letter),
 * centered on its own middle so it can turn in place; `center` puts it back. */
export function useLetters(depth: number, bevel = false) {
  const svg = useSvg();
  const letters = useMemo(
    () =>
      svg.paths.map((path) => {
        const geometry = new THREE.ExtrudeGeometry(SVGLoader.createShapes(path), {
          depth,
          bevelEnabled: bevel,
          ...EXTRUDE,
        });
        geometry.computeBoundingBox();
        const center = new THREE.Vector3();
        geometry.boundingBox!.getCenter(center);
        geometry.translate(-center.x, -center.y, -center.z);
        return { geometry, center };
      }),
    [svg, depth, bevel],
  );
  useEffect(() => () => letters.forEach(({ geometry }) => geometry.dispose()), [letters]);
  return letters;
}

/** The filled cells of the artwork's pixel grid, found by drawing it small. */
export function usePixelCells() {
  const [cells, setCells] = useState<[number, number][]>([]);
  useEffect(() => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = COLS;
      canvas.height = ROWS;
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) return;
      context.drawImage(image, 0, 0, COLS, ROWS);
      const { data } = context.getImageData(0, 0, COLS, ROWS);
      const found: [number, number][] = [];
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (data[(y * COLS + x) * 4 + 3] > 100) found.push([x, y]);
        }
      }
      setCells(found);
    };
    image.src = SRC;
  }, []);
  return cells;
}
