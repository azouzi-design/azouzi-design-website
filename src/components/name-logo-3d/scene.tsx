"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { SVGLoader } from "three/examples/jsm/loaders/SVGLoader.js";
import { SVG_HEIGHT, SVG_WIDTH } from "./size";

// The header's name logo as 3D letters: the artwork's paths pushed back into
// dark steel under a glossy clear coat, swaying slowly and leaning toward the
// pointer.

const SRC = "/images/name-logo.svg";

// Narrow: the camera sits far back, so the letters keep their proportions as
// they turn (a wide view would stretch the pixel font's small steps).
const FOV = 6;
// Extrusion depth, in the artwork's units (it is 16 tall).
const DEPTH = 4;
// The logo never takes more than this share of the canvas width.
const MAX_WIDTH_SHARE = 0.8;

// A slow idle sway, and a lean toward the pointer anywhere on the page
// (radians at the screen's edges).
const SWAY = 0.22;
const SWAY_SPEED = 0.5;
const LEAN = { x: 0.35, y: 0.5 };
const DAMPING = 4;
// Held still at this angle with reduced motion.
const RESTING: [number, number, number] = [0.12, -0.25, 0];

// Dark grey, part metal: reads as steel, but not so metallic that walls
// turned from the light go black.
const STEEL = "#8c8c8c";

/** Window-wide pointer position, -1..1 on each axis from the screen center. */
function usePointer() {
  const pointer = useRef({ x: 0, y: 0, active: false });
  useEffect(() => {
    const move = (event: PointerEvent) => {
      pointer.current.x = (event.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (event.clientY / window.innerHeight) * 2 - 1;
      pointer.current.active = true;
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

/** Keeps one scene unit equal to one CSS pixel at the logo's front face,
 * whatever size the canvas is. */
function PixelCamera() {
  const get = useThree((state) => state.get);
  const height = useThree((state) => state.size.height);
  useLayoutEffect(() => {
    const camera = get().camera as THREE.PerspectiveCamera;
    const distance = height / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    camera.position.set(0, 0, distance);
    camera.far = distance * 3;
    camera.updateProjectionMatrix();
  }, [get, height]);
  return null;
}

function Logo({
  logoHeight,
  reduced,
  onReady,
}: {
  logoHeight: number;
  reduced: boolean;
  onReady: () => void;
}) {
  const svg = useLoader(SVGLoader, SRC);
  const group = useRef<THREE.Group>(null);
  const pointer = usePointer();
  const width = useThree((state) => state.size.width);
  // Mounted only once the artwork has loaded (its loader suspends until then).
  useEffect(onReady, [onReady]);

  // No bevel: on a pixel font it rounds every little step, and the gloss
  // then glints on each one.
  const geometry = useMemo(() => {
    const shapes = svg.paths.flatMap((path) => SVGLoader.createShapes(path));
    return new THREE.ExtrudeGeometry(shapes, { depth: DEPTH, bevelEnabled: false });
  }, [svg]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }, delta) => {
    const logo = group.current;
    if (!logo || reduced) return;
    const t = clock.getElapsedTime();
    const { x, y, active } = pointer.current;
    const damp = (from: number, to: number) => THREE.MathUtils.damp(from, to, DAMPING, delta);
    logo.rotation.y = damp(logo.rotation.y, active ? x * LEAN.y : Math.sin(t * SWAY_SPEED) * SWAY);
    logo.rotation.x = damp(
      logo.rotation.x,
      active ? y * LEAN.x : Math.sin(t * SWAY_SPEED * 0.7) * SWAY * 0.3,
    );
  });

  // Artwork units to px: logoHeight tall, unless that's too wide to fit.
  const height = Math.min(logoHeight, (width * MAX_WIDTH_SHARE * SVG_HEIGHT) / SVG_WIDTH);
  const scale = height / SVG_HEIGHT;

  return (
    <group ref={group} rotation={reduced ? RESTING : [0, 0, 0]}>
      {/* SVG y runs down, three.js y up: flip, then center on the origin
          with the front face at z = 0 (where the size in px is exact). */}
      <mesh
        geometry={geometry}
        scale={[scale, -scale, -scale]}
        position={[(-SVG_WIDTH * scale) / 2, (SVG_HEIGHT * scale) / 2, 0]}
      >
        <meshPhysicalMaterial
          color={STEEL}
          metalness={0.55}
          roughness={0.3}
          clearcoat={1}
          clearcoatRoughness={0}
        />
      </mesh>
    </group>
  );
}

/** Lamps bright enough that the face keeps its own color, strips for the
 * lacquer to catch, and only a dim panel behind the camera, which a face-on
 * clear coat mirrors (brighter, it would lay a whitish veil over it). */
function Lights() {
  return (
    <>
      <ambientLight intensity={1} />
      <directionalLight position={[-60, 80, 120]} intensity={1.3} />
      {/* A soft lamp from the lower right, for the walls facing away from
          the key. */}
      <directionalLight position={[80, -70, 60]} intensity={0.9} />
      <Environment resolution={128} environmentIntensity={1.5}>
        <Lightformer form="rect" intensity={0.3} position={[0, 0, 10]} scale={[12, 6, 1]} />
        <Lightformer form="rect" intensity={3} position={[0, 5, 5]} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={1.5} position={[-6, 0, 3]} scale={[6, 1, 1]} />
        {/* Soft fills below and to the right: the metal walls facing that
            way reflect these instead of empty dark, so they read as shaded
            steel, not black. */}
        <Lightformer form="rect" intensity={2} position={[0, -5, 4]} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={1.6} position={[6, 0, 3]} scale={[6, 3, 1]} />
      </Environment>
    </>
  );
}

/** The name logo in 3D, filling its parent; `logoHeight` is in px. Renders at
 * 3x the screen's resolution (up to 6x) and lets the browser scale it down,
 * so the pixel font's steps stay smooth as it turns. */
export default function NameLogoScene({
  logoHeight,
  reduced,
  onReady,
}: {
  logoHeight: number;
  reduced: boolean;
  onReady: () => void;
}) {
  return (
    <Canvas
      camera={{ fov: FOV, near: 1 }}
      dpr={Math.min(6, window.devicePixelRatio * 3)}
      gl={{ alpha: true, antialias: true }}
      // The canvas is wider than the name and would otherwise take taps meant
      // for the buttons beside it (the pointer is read window-wide instead).
      style={{ pointerEvents: "none" }}
    >
      <PixelCamera />
      <Lights />
      <Logo logoHeight={logoHeight} reduced={reduced} onReady={onReady} />
    </Canvas>
  );
}
