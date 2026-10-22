"use client";

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import {
  CELL_X,
  CELL_Y,
  clamp01,
  easeInOut,
  useExtruded,
  useLetters,
  usePixelCells,
  usePointer,
} from "./geometry";
import type { Look } from "./looks";
import { LookMaterial } from "./materials";
import { SVG_HEIGHT, SVG_WIDTH } from "./size";

// Everything here is drawn in the artwork's own units, inside a group that
// flips and scales it to px (see Logo in scene.tsx). That group mirrors z,
// so a negative local z is toward the viewer.

// "layers": how many copies, and the gap between them.
const LAYERS = 6;
const LAYER_GAP = 2.5;

// "wave": seconds between ripples, delay from one letter to the next, and
// how long one letter's flip takes.
const WAVE_EVERY = 4;
const WAVE_STEP = 0.07;
const WAVE_FLIP = 0.9;

// "magnetic": reach of the pull (px), how far a letter lifts and turns.
const MAGNET_REACH = 70;
const MAGNET_LIFT = 10;
const MAGNET_TURN = 0.6;

// "tiles": one sweep to black and back every TILES_EVERY seconds, crossing
// the logo in TILE_STEP * COLS seconds; each tile takes TILE_FLIP to turn.
const TILES_EVERY = 6;
const TILE_STEP = 0.01;
const TILE_FLIP = 0.4;

export function Solid({ look }: { look: Look }) {
  const geometry = useExtruded(look.depth, look.bevel);
  return (
    <mesh geometry={geometry} castShadow={look.shadow}>
      <LookMaterial look={look} />
    </mesh>
  );
}

export function Wire({ look }: { look: Look }) {
  const geometry = useExtruded(look.depth);
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, 20), [geometry]);
  useEffect(() => () => edges.dispose(), [edges]);
  return (
    <lineSegments geometry={edges}>
      <lineBasicMaterial color="#9a9a9a" />
    </lineSegments>
  );
}

export function Layers({ look }: { look: Look }) {
  const geometry = useExtruded(look.depth);
  return Array.from({ length: LAYERS }, (_, i) => (
    <mesh key={i} geometry={geometry} position={[0, 0, i * LAYER_GAP]}>
      <LookMaterial look={look} opacity={1 - i / LAYERS} />
    </mesh>
  ));
}

/** One block per filled pixel, with a crest that lifts columns in turn. */
export function Voxels({ look, reduced }: { look: Look; reduced: boolean }) {
  const cells = usePixelCells();
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(({ clock }) => {
    const blocks = mesh.current;
    if (!blocks) return;
    const t = clock.getElapsedTime();
    cells.forEach(([x, y], i) => {
      const lift = reduced ? 0 : Math.max(0, Math.sin(t * 1.6 - x * 0.12)) ** 6 * 10;
      dummy.position.set((x + 0.5) * CELL_X, (y + 0.5) * CELL_Y, look.depth / 2 - lift);
      dummy.updateMatrix();
      blocks.setMatrixAt(i, dummy.matrix);
    });
    blocks.instanceMatrix.needsUpdate = true;
  });

  if (!cells.length) return null;
  return (
    <instancedMesh key={cells.length} ref={mesh} args={[undefined, undefined, cells.length]}>
      <boxGeometry args={[CELL_X * 0.9, CELL_Y * 0.9, look.depth]} />
      <LookMaterial look={look} />
    </instancedMesh>
  );
}

/** Each letter its own piece, moving as `look.letters` says. `scale` is px
 * per artwork unit, to find letters on screen for "magnetic". */
export function Letters({
  look,
  reduced,
  scale,
}: {
  look: Look;
  reduced: boolean;
  scale: number;
}) {
  const letters = useLetters(look.depth, look.bevel);
  const meshes = useRef<(THREE.Mesh | null)[]>([]);
  const pointer = usePointer();
  const canvas = useThree((state) => state.gl.domElement);

  useFrame(({ clock }, delta) => {
    if (reduced) return;
    const t = clock.getElapsedTime();
    const rect = look.letters === "magnetic" ? canvas.getBoundingClientRect() : null;

    letters.forEach(({ center }, i) => {
      const mesh = meshes.current[i];
      if (!mesh) return;

      if (look.letters === "wave") {
        const local = (t % WAVE_EVERY) - i * WAVE_STEP;
        mesh.rotation.x = easeInOut(clamp01(local / WAVE_FLIP)) * Math.PI * 2;
        return;
      }

      if (rect) {
        // Where this letter is on screen: the logo is centered in the canvas
        // and one artwork unit is `scale` px at the face.
        const screenX = rect.left + rect.width / 2 + (center.x - SVG_WIDTH / 2) * scale;
        const screenY = rect.top + rect.height / 2 + (center.y - SVG_HEIGHT / 2) * scale;
        const { clientX, clientY, active } = pointer.current;
        const dx = clientX - screenX;
        const dy = clientY - screenY;
        const pull = active ? Math.exp(-((dx * dx + dy * dy) / MAGNET_REACH ** 2)) : 0;
        const damp = (from: number, to: number) => THREE.MathUtils.damp(from, to, 8, delta);
        mesh.position.z = damp(mesh.position.z, center.z - pull * MAGNET_LIFT);
        mesh.rotation.y = damp(mesh.rotation.y, -Math.sign(dx) * pull * MAGNET_TURN);
        mesh.rotation.x = damp(mesh.rotation.x, Math.sign(dy) * pull * MAGNET_TURN * 0.5);
      }
    });
  });

  return letters.map(({ geometry, center }, i) => (
    <mesh
      key={i}
      ref={(mesh) => {
        meshes.current[i] = mesh;
      }}
      geometry={geometry}
      position={center}
    >
      <LookMaterial look={look} />
    </mesh>
  ));
}

/** The pixel grid as tiles, grey on the face and black on the back, that
 * flip over in a sweep and then flip back. */
export function Tiles({ look, reduced }: { look: Look; reduced: boolean }) {
  const cells = usePixelCells();
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  // Box faces: +x, -x, +y, -y, +z (away from the viewer here), -z (toward).
  const materials = useMemo(() => {
    const side = new THREE.MeshStandardMaterial({ color: "#a8a8a8", roughness: 0.6 });
    const back = new THREE.MeshStandardMaterial({ color: "#171717", roughness: 0.4 });
    const face = new THREE.MeshStandardMaterial({ color: "#c3c3c3", roughness: 0.45 });
    return [side, side, side, side, back, face];
  }, []);
  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials]);

  useFrame(({ clock }) => {
    const tiles = mesh.current;
    if (!tiles) return;
    const t = clock.getElapsedTime() % TILES_EVERY;
    cells.forEach(([x, y], i) => {
      const start = x * TILE_STEP;
      const over = easeInOut(clamp01((t - start) / TILE_FLIP));
      const back = easeInOut(clamp01((t - TILES_EVERY / 2 - start) / TILE_FLIP));
      dummy.position.set((x + 0.5) * CELL_X, (y + 0.5) * CELL_Y, 0);
      dummy.rotation.x = reduced ? 0 : (over - back) * Math.PI;
      dummy.updateMatrix();
      tiles.setMatrixAt(i, dummy.matrix);
    });
    tiles.instanceMatrix.needsUpdate = true;
  });

  if (!cells.length) return null;
  return (
    <instancedMesh
      key={cells.length}
      ref={mesh}
      args={[undefined, undefined, cells.length]}
      material={materials}
    >
      <boxGeometry args={[CELL_X * 0.86, CELL_Y * 0.86, look.depth]} />
    </instancedMesh>
  );
}
