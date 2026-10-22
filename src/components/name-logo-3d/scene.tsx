"use client";

import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { Layers, Letters, Solid, Tiles, Voxels, Wire } from "./builds";
import { easeInOut, usePointer } from "./geometry";
import { LOOKS, type Look } from "./looks";
import { SVG_HEIGHT, SVG_WIDTH } from "./size";

// A narrow field of view keeps the letters close to flat face-on, while
// still showing their sides as they turn.
const FOV = 20;
// The logo never takes more than this share of the canvas width.
const MAX_WIDTH_SHARE = 0.8;

// "lean": a slow idle sway, plus a lean toward the pointer anywhere on the
// page (radians at the screen's edges, before the look's own `lean`).
const SWAY = 0.22;
const SWAY_SPEED = 0.5;
const LEAN = { x: 0.35, y: 0.5 };
const DAMPING = 4;

// "shadow": how far behind the letters' face the page sits (px).
const SHADOW_GAP = 14;

/** Keeps one scene unit equal to one CSS pixel at the logo's front face,
 * whatever size the canvas is, for a camera with field of view `fov`. */
function PixelCamera({ fov }: { fov: number }) {
  const get = useThree((state) => state.get);
  const height = useThree((state) => state.size.height);
  useLayoutEffect(() => {
    const camera = get().camera as THREE.PerspectiveCamera;
    const distance = height / 2 / Math.tan(THREE.MathUtils.degToRad(fov / 2));
    camera.position.set(0, 0, distance);
    camera.far = distance * 3;
    camera.updateProjectionMatrix();
  }, [get, height, fov]);
  return null;
}

/** Turns its children as the look's motion describes. */
function Motion({
  look,
  reduced,
  children,
}: {
  look: Look;
  reduced: boolean;
  children: ReactNode;
}) {
  const group = useRef<THREE.Group>(null);
  const pointer = usePointer();
  const amount = look.lean ?? 1;

  useFrame(({ clock }, delta) => {
    const logo = group.current;
    if (!logo || reduced) return;
    const t = clock.getElapsedTime();
    const { x, y, active } = pointer.current;
    const damp = (from: number, to: number) => THREE.MathUtils.damp(from, to, DAMPING, delta);

    switch (look.motion) {
      case "lean":
        logo.rotation.y = damp(
          logo.rotation.y,
          (active ? x * LEAN.y : Math.sin(t * SWAY_SPEED) * SWAY) * amount,
        );
        logo.rotation.x = damp(
          logo.rotation.x,
          (active ? y * LEAN.x : Math.sin(t * SWAY_SPEED * 0.7) * SWAY * 0.3) * amount,
        );
        break;
      case "turntable":
        logo.rotation.y = t * 0.6;
        logo.rotation.x = damp(logo.rotation.x, active ? y * LEAN.x : 0.15);
        break;
      case "float":
        logo.position.y = Math.sin(t * 1.2) * 3;
        logo.rotation.z = Math.sin(t * 0.8) * 0.03;
        logo.rotation.y = damp(logo.rotation.y, active ? x * 0.25 : Math.sin(t * 0.5) * 0.12);
        logo.rotation.x = damp(logo.rotation.x, active ? y * 0.2 : 0.1);
        break;
      case "flip": {
        // A full somersault in the first 30% of every 5s, then rest.
        const phase = (t % 5) / 5;
        logo.rotation.x = easeInOut(Math.min(phase / 0.3, 1)) * Math.PI * 2;
        logo.rotation.y = damp(logo.rotation.y, active ? x * LEAN.y : 0);
        break;
      }
      case "still":
        break;
    }
  });

  const tilted = reduced && look.motion !== "still";
  return (
    <group ref={group} rotation={tilted ? [0.12, -0.25, 0] : [0, 0, 0]}>
      {children}
    </group>
  );
}

function Logo({
  look,
  logoHeight,
  reduced,
  onReady,
}: {
  look: Look;
  logoHeight: number;
  reduced: boolean;
  onReady: () => void;
}) {
  const width = useThree((state) => state.size.width);
  // Mounted only once the artwork has loaded (its loader suspends until then).
  useEffect(onReady, [onReady]);

  // Artwork units to px: logoHeight tall, unless that's too wide to fit.
  const height = Math.min(logoHeight, (width * MAX_WIDTH_SHARE * SVG_HEIGHT) / SVG_WIDTH);
  const scale = height / SVG_HEIGHT;
  const props = { look, reduced };

  return (
    <Motion look={look} reduced={reduced}>
      {/* SVG y runs down, three.js y up: flip, then center on the origin
          with the front face at z = 0 (where the size in px is exact). */}
      <group
        scale={[scale, -scale, -scale]}
        position={[(-SVG_WIDTH * scale) / 2, (SVG_HEIGHT * scale) / 2, 0]}
      >
        {look.build === "solid" && <Solid look={look} />}
        {look.build === "wire" && <Wire look={look} />}
        {look.build === "layers" && <Layers look={look} />}
        {look.build === "voxels" && <Voxels {...props} />}
        {look.build === "letters" && <Letters {...props} scale={scale} />}
        {look.build === "tiles" && <Tiles {...props} />}
      </group>
    </Motion>
  );
}

/** The page under a floating logo: invisible, except for the shadow on it. A
 * key light that drifts with the pointer moves the shadow. */
function ShadowCatcher({ reduced }: { reduced: boolean }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const pointer = usePointer();

  useFrame((_, delta) => {
    const key = light.current;
    if (!key || reduced) return;
    const { x, y, active } = pointer.current;
    // The light sits opposite the pointer, so the shadow falls away from it.
    const toX = active ? -x * 120 : -60;
    const toY = active ? y * 120 : 80;
    key.position.x = THREE.MathUtils.damp(key.position.x, toX, 3, delta);
    key.position.y = THREE.MathUtils.damp(key.position.y, toY, 3, delta);
  });

  return (
    <>
      <directionalLight
        ref={light}
        position={[-60, 80, 160]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-radius={10}
        shadow-blurSamples={16}
        shadow-camera-left={-220}
        shadow-camera-right={220}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-camera-near={1}
        shadow-camera-far={600}
      />
      <mesh position={[0, 0, -SHADOW_GAP]} receiveShadow>
        <planeGeometry args={[2000, 1000]} />
        <shadowMaterial opacity={0.1} />
      </mesh>
    </>
  );
}

function Lights({ look, reduced }: { look: Look; reduced: boolean }) {
  if (look.material === "enamel") {
    // Lamps bright enough that
    // the face keeps its own color, strips for the lacquer to catch, and only
    // a dim panel behind the camera, which a face-on clear coat mirrors.
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
              way reflect these instead of empty dark, so they read as
              shaded steel, not black. */}
          <Lightformer form="rect" intensity={2} position={[0, -5, 4]} scale={[10, 3, 1]} />
          <Lightformer form="rect" intensity={1.6} position={[6, 0, 3]} scale={[6, 3, 1]} />
        </Environment>
      </>
    );
  }
  if (look.env) {
    // Studio strips for reflective and clear looks, so they have something
    // to mirror.
    return (
      <>
        <ambientLight intensity={0.3} />
        <Environment resolution={256}>
          {/* Behind the camera: what a face looking straight out mirrors. */}
          <Lightformer form="rect" intensity={1.2} position={[0, 0, 10]} scale={[12, 6, 1]} />
          <Lightformer form="rect" intensity={3} position={[0, 5, 5]} scale={[10, 2, 1]} />
          <Lightformer form="rect" intensity={1.5} position={[-6, 0, 3]} scale={[6, 1, 1]} />
          <Lightformer form="ring" intensity={2} position={[5, -2, 4]} scale={2} />
        </Environment>
      </>
    );
  }

  const [ambient, key] = look.light ?? [1.6, 2.2];
  if (look.shadow) {
    return (
      <>
        <ambientLight intensity={ambient} />
        <ShadowCatcher reduced={reduced} />
      </>
    );
  }
  return (
    <>
      <ambientLight intensity={ambient} />
      {/* Lit from the top-left, like the rest of the site. Raking: low and
          from the side, so only edges catch it. */}
      <directionalLight
        position={look.rake ? [-140, 90, 25] : [-60, 80, 120]}
        intensity={key}
      />
      {!look.rake && <directionalLight position={[80, -40, 40]} intensity={0.5} />}
    </>
  );
}

const noop = () => {};

/** The name logo in 3D, filling its parent. `logoHeight` is in px. `fov`
 * narrows the camera (less perspective); `supersample` renders at 3x the
 * screen's resolution (up to 6x) and lets the browser scale it down, for
 * smoother edges in motion. */
export default function NameLogoScene({
  look: id = "matte",
  logoHeight,
  reduced,
  onReady = noop,
  fov = FOV,
  supersample = false,
}: {
  look?: string;
  logoHeight: number;
  reduced: boolean;
  onReady?: () => void;
  fov?: number;
  supersample?: boolean;
}) {
  const look = LOOKS.find((candidate) => candidate.id === id) ?? LOOKS[0];
  return (
    <Canvas
      camera={{ fov, near: 1 }}
      dpr={supersample ? Math.min(6, window.devicePixelRatio * 3) : [1, 2]}
      gl={{ alpha: true, antialias: true }}
      // Variance shadow maps honour the light's blur radius, for a soft shadow.
      shadows={look.shadow ? "variance" : false}
    >
      <PixelCamera fov={fov} />
      <Lights look={look} reduced={reduced} />
      <Logo
        look={look}
        logoHeight={logoHeight}
       
        reduced={reduced}
        onReady={onReady}
      />
    </Canvas>
  );
}
