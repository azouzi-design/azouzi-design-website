"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
  type RigidBodyProps,
} from "@react-three/rapier";
import {
  CLIP,
  PX_PER_UNIT,
  getCardLayout,
  type CardLayout,
} from "./lanyard-layout";
import {
  createBackFace,
  createFrontFace,
  fontFamily,
  hotspotAt,
  loadFont,
  type CardFace,
  type Hotspot,
} from "./card-faces";
import {
  SURFACE,
  createBodyGeometry,
  createFaceGeometry,
  createSurfaceNormalMap,
} from "./card-surface";

const STRAP_W = 0.23;
// Shared, so material props don't change identity on every render.
const RELIEF_SCALE = new THREE.Vector2(SURFACE.reliefStrength, SURFACE.reliefStrength);
/** Corner radius of the row highlight, in face px (as in Figma). */
const HIGHLIGHT_RADIUS_PX = 12;
const STRAP_TEXTURE_H = 128;
const FOV = 25;

const INK = "#171717";

type Segment = RapierRigidBody & { lerped?: THREE.Vector3 };

async function drawStrap(): Promise<HTMLCanvasElement> {
  const size = STRAP_TEXTURE_H * 0.42;
  const font = `600 ${size}px ${fontFamily()}`;
  await loadFont(600, size);
  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = font;
  const gap = STRAP_TEXTURE_H * 0.9;
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(measure.measureText("AZOUZI.DESIGN").width + gap);
  canvas.height = STRAP_TEXTURE_H;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = INK;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.font = font;
  ctx.textBaseline = "middle";
  ctx.fillText("AZOUZI.DESIGN", gap / 2, canvas.height / 2);
  return canvas;
}

const STRAP_POINTS = 64;
const STRAP_OVERHANG = 1.5;

/**
 * Flat ribbon following the strap curve. UVs run along real arc length so the
 * text keeps its proportions however the strap bends or stretches.
 */
function updateRibbon(
  geometry: THREE.BufferGeometry,
  points: THREE.Vector3[],
  tileLength: number,
) {
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const uv = geometry.getAttribute("uv") as THREE.BufferAttribute;
  let length = 0;
  for (let i = 0; i < points.length; i++) {
    const prev = points[Math.max(i - 1, 0)];
    const next = points[Math.min(i + 1, points.length - 1)];
    if (i > 0) length += points[i].distanceTo(prev);
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const tl = Math.hypot(tx, ty) || 1;
    // Normal pointing to the strap's right when walking down from the top.
    const nx = (-ty / tl) * (STRAP_W / 2);
    const ny = (tx / tl) * (STRAP_W / 2);
    const p = points[i];
    position.setXYZ(i * 2, p.x + nx, p.y + ny, p.z);
    position.setXYZ(i * 2 + 1, p.x - nx, p.y - ny, p.z);
    uv.setXY(i * 2, length / tileLength, 1);
    uv.setXY(i * 2 + 1, length / tileLength, 0);
  }
  position.needsUpdate = true;
  uv.needsUpdate = true;
  geometry.computeBoundingSphere();
}

function createRibbonGeometry() {
  const geometry = new THREE.BufferGeometry();
  const count = STRAP_POINTS + 1;
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(new Float32Array(count * 2 * 3), 3),
  );
  geometry.setAttribute(
    "uv",
    new THREE.BufferAttribute(new Float32Array(count * 2 * 2), 2),
  );
  const index: number[] = [];
  for (let i = 0; i < STRAP_POINTS; i++) {
    const a = i * 2;
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
  }
  geometry.setIndex(index);
  return geometry;
}

/** Keeps PX_PER_UNIT constant and puts the strap anchor at the canvas top. */
function PixelCamera() {
  const camera = useThree((state) => state.camera);
  const height = useThree((state) => state.size.height);
  useLayoutEffect(() => {
    const halfHeight = height / PX_PER_UNIT / 2;
    const z = halfHeight / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    camera.position.set(0, -halfHeight, z);
    camera.updateProjectionMatrix();
  }, [camera, height]);
  return null;
}

function useCanvasTexture(
  draw: () => HTMLCanvasElement | Promise<HTMLCanvasElement>,
  repeat = false,
) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  useEffect(() => {
    let cancelled = false;
    let created: THREE.CanvasTexture | null = null;
    Promise.resolve(draw()).then((canvas) => {
      if (cancelled) return;
      created = new THREE.CanvasTexture(canvas);
      created.colorSpace = THREE.SRGBColorSpace;
      created.anisotropy = 8;
      if (repeat) created.wrapS = created.wrapT = THREE.RepeatWrapping;
      setTexture(created);
    }, console.error);
    return () => {
      cancelled = true;
      created?.dispose();
    };
  }, [draw, repeat]);
  return texture;
}

function useCardFace(
  create: (layout: CardLayout) => Promise<CardFace>,
  layout: CardLayout,
) {
  const [state, setState] = useState<{
    face: CardFace;
    texture: THREE.CanvasTexture;
  } | null>(null);
  useEffect(() => {
    let cancelled = false;
    let texture: THREE.CanvasTexture | null = null;
    create(layout).then((face) => {
      if (cancelled) return;
      texture = new THREE.CanvasTexture(face.canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 8;
      setState({ face, texture });
    }, console.error);
    return () => {
      cancelled = true;
      texture?.dispose();
    };
  }, [create, layout]);
  return state;
}

type Side = "front" | "back";
type SpotRef = { side: Side; id: string } | null;

/**
 * Opens a link from a tap. Touch has no hover, so taps can't use the real <a>
 * overlay that desktop clicks go through (see Band).
 */
function openLink(href: string) {
  if (href.startsWith("mailto:")) window.location.href = href;
  else window.open(href, "_blank", "noopener,noreferrer");
}

const segmentProps: RigidBodyProps = {
  type: "dynamic",
  canSleep: true,
  colliders: false,
  angularDamping: 2,
  linearDamping: 2,
};

function createCardGeometry({ w, h }: CardLayout) {
  const radius = SURFACE.cornerRadiusPx / PX_PER_UNIT;
  return {
    body: createBodyGeometry(w, h, radius, 0.02),
    face: createFaceGeometry(w, h, radius),
    normalMap: createSurfaceNormalMap(),
  };
}

type CardFaceState = NonNullable<ReturnType<typeof useCardFace>>;

type BandProps = {
  maxSpeed?: number;
  minSpeed?: number;
  front: CardFaceState | null;
  back: CardFaceState | null;
  strap: THREE.CanvasTexture | null;
  cardGeometry: ReturnType<typeof createCardGeometry>;
  layout: CardLayout;
  /** Real <a> laid over the hovered link row (see useFrame). */
  link: HTMLAnchorElement | null;
};

// Everything heavy (textures, geometry) lives in Lanyard so Band can be
// remounted cheaply to play the "thrown" entrance.
function Band({
  maxSpeed = 50,
  minSpeed = 10,
  front,
  back,
  strap,
  cardGeometry,
  layout,
  link,
}: BandProps) {
  const { w: CARD_W, h: CARD_H, segment: SEGMENT } = layout;
  // How far right of the anchor the card is thrown in from. Narrower on
  // phones, where the desktop throw starts and swings off-screen.
  const spread = layout.portrait ? 0.4 : 1;
  const band = useRef<THREE.Mesh>(null);
  const [ribbon] = useState(createRibbonGeometry);
  const fixed = useRef<Segment>(null!);
  const j1 = useRef<Segment>(null!);
  const j2 = useRef<Segment>(null!);
  const j3 = useRef<Segment>(null!);
  const card = useRef<Segment>(null!);

  const [vec] = useState(() => new THREE.Vector3());
  const [ang] = useState(() => new THREE.Vector3());
  const [rot] = useState(() => new THREE.Vector3());
  const [dir] = useState(() => new THREE.Vector3());
  const [corner] = useState(() => new THREE.Vector3());
  const [curve] = useState(() => {
    const c = new THREE.CatmullRomCurve3([
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
      new THREE.Vector3(),
    ]);
    c.curveType = "chordal";
    return c;
  });
  const [dragged, setDragged] = useState<THREE.Vector3 | false>(false);
  const [hovered, setHovered] = useState(false);
  const [spot, setSpot] = useState<SpotRef>(null);
  const [pressed, setPressed] = useState<SpotRef>(null);
  const pointerDown = useRef<{ x: number; y: number; spot: Hotspot | null }>(
    null,
  );
  const frontMesh = useRef<THREE.Mesh>(null);
  const backMesh = useRef<THREE.Mesh>(null);
  // Last pointer type over the card: the link overlay is for mouse/pen only.
  const pointerType = useRef("mouse");
  // Set by onPointerOut, cleared by any later move over the card (R3F also
  // fires "out" when the hit switches between the card's own meshes).
  const pendingOut = useRef(false);
  const spotRef = useRef<SpotRef>(null);
  // A frame must render for the overlay to move, even when the card is
  // still and R3F would otherwise skip frames.
  const invalidate = useThree((state) => state.invalidate);
  useEffect(() => {
    spotRef.current = spot;
    invalidate();
  }, [spot, invalidate]);
  // The overlay element, owned here so useFrame can position it.
  const anchorRef = useRef<HTMLAnchorElement | null>(null);

  // Ad and pop-up blockers stop tabs that script opens after a click on a
  // <canvas> (the pop-under ad pattern), so on desktop a link must be a real
  // <a> under the cursor. The overlay sits over the hovered row; its clicks
  // are native link clicks. While it's hovered the canvas sees the pointer
  // leave, so these handlers keep the card's hover state in its place.
  useEffect(() => {
    const anchor = link;
    anchorRef.current = anchor;
    if (!anchor) return;
    const enter = () => {
      pendingOut.current = false;
    };
    const leave = () => {
      setHovered(false);
      setSpot(null);
      setPressed(null);
    };
    const down = () => setPressed(spotRef.current);
    const up = () => setPressed(null);
    anchor.addEventListener("pointerenter", enter);
    anchor.addEventListener("pointerleave", leave);
    anchor.addEventListener("pointerdown", down);
    anchor.addEventListener("pointerup", up);
    return () => {
      anchor.removeEventListener("pointerenter", enter);
      anchor.removeEventListener("pointerleave", leave);
      anchor.removeEventListener("pointerdown", down);
      anchor.removeEventListener("pointerup", up);
    };
  }, [link]);

  // A touch that turns into a page scroll ends with `pointercancel`, not
  // `pointerup`, often outside the card. Without this the card stays grabbed
  // and jumps to wherever the finger moves next.
  useEffect(() => {
    if (!dragged) return;
    const release = () => {
      setDragged(false);
      setPressed(null);
      pointerDown.current = null;
    };
    window.addEventListener("pointercancel", release);
    window.addEventListener("pointerup", release);
    return () => {
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("pointerup", release);
    };
  }, [dragged]);

  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], SEGMENT]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], SEGMENT]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], SEGMENT]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, CARD_H / 2 + CLIP, 0],
  ]);

  useEffect(() => {
    if (!hovered) return;
    document.body.style.cursor = spot ? "pointer" : dragged ? "grabbing" : "grab";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hovered, dragged, spot]);

  // Row highlight: a small translucent shape over the hovered/pressed row.
  // Moving it is free; redrawing the 3x-resolution face texture on every
  // hover change (as before) stalled frames while the GPU re-uploaded it.
  // All rows share one size, so one geometry serves every row.
  const highlightGeometry = useMemo(() => {
    const row = front?.face.hotspots[0];
    if (!row) return null;
    return createFaceGeometry(
      row.w / PX_PER_UNIT,
      row.h / PX_PER_UNIT,
      HIGHLIGHT_RADIUS_PX / PX_PER_UNIT,
    );
  }, [front]);
  useEffect(() => () => highlightGeometry?.dispose(), [highlightGeometry]);
  const active = pressed ?? spot;
  const activeFace = active?.side === "front" ? front : active?.side === "back" ? back : null;
  const activeRow = activeFace?.face.hotspots.find((h) => h.id === active?.id);

  function hitSpot(e: { object: THREE.Object3D; uv?: THREE.Vector2 }) {
    const side: Side | null =
      e.object === frontMesh.current
        ? "front"
        : e.object === backMesh.current
          ? "back"
          : null;
    const card = side === "front" ? front : side === "back" ? back : null;
    if (!side || !card || !e.uv) return null;
    const hit = hotspotAt(card.face, e.uv);
    return hit ? { side, hit } : null;
  }

  useFrame((state, delta) => {
    if (dragged) {
      // Project the pointer onto the z = 0 plane the badge lives in.
      const { camera } = state;
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(camera);
      dir.copy(vec).sub(camera.position).normalize();
      vec.copy(camera.position).addScaledVector(dir, -camera.position.z / dir.z);
      [card, j1, j2, j3, fixed].forEach((ref) => ref.current?.wakeUp());
      card.current?.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }
    if (!fixed.current || !band.current) return;

    // Smooth the joints so the strap doesn't jitter.
    [j1, j2].forEach((ref) => {
      const body = ref.current;
      body.lerped ??= new THREE.Vector3().copy(body.translation());
      const distance = Math.max(
        0.1,
        Math.min(1, body.lerped.distanceTo(body.translation())),
      );
      // Capped at 1: on slow frames (phones) it would overshoot and whip.
      body.lerped.lerp(
        body.translation(),
        Math.min(1, delta * (minSpeed + distance * (maxSpeed - minSpeed))),
      );
    });
    // Top (anchor) to bottom (card), so the text reads downwards.
    // The strap carries on above the canvas (out of view) so its shadow,
    // which the light pushes downwards, still reaches the top edge.
    curve.points[0].copy(fixed.current.translation()).y += STRAP_OVERHANG;
    curve.points[1].copy(fixed.current.translation());
    curve.points[2].copy(j1.current.lerped!);
    curve.points[3].copy(j2.current.lerped!);
    curve.points[4].copy(j3.current.translation());
    if (strap) {
      const image = strap.image as HTMLCanvasElement;
      const tileLength = (STRAP_W * image.width) / image.height;
      updateRibbon(ribbon, curve.getSpacedPoints(STRAP_POINTS), tileLength);
    }

    // Gently turn the card back to face the viewer.
    ang.copy(card.current.angvel());
    rot.copy(card.current.rotation());
    card.current.setAngvel({ x: ang.x, y: ang.y - rot.y * 0.25, z: ang.z }, true);

    // Lay the link overlay over the hovered row's on-screen bounds, every
    // frame, so it follows the card as it swings.
    const anchor = anchorRef.current;
    if (!anchor) return;
    const spot = spotRef.current;
    const face = spot?.side === "front" ? front : spot?.side === "back" ? back : null;
    const mesh = spot?.side === "front" ? frontMesh.current : backMesh.current;
    const hotspot = face?.face.hotspots.find((h) => h.id === spot?.id);
    if (!hotspot || !mesh || dragged || pointerType.current === "touch") {
      if (anchor.style.display !== "none") anchor.style.display = "none";
      return;
    }
    const { width, height } = state.size;
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (const [fx, fy] of [
      [hotspot.x, hotspot.y],
      [hotspot.x + hotspot.w, hotspot.y],
      [hotspot.x, hotspot.y + hotspot.h],
      [hotspot.x + hotspot.w, hotspot.y + hotspot.h],
    ]) {
      // Face px -> face mesh space (centred, y up) -> screen px.
      corner
        .set(
          (fx / face!.face.width - 0.5) * CARD_W,
          (0.5 - fy / face!.face.height) * CARD_H,
          0,
        )
        .applyMatrix4(mesh.matrixWorld)
        .project(state.camera);
      const x = ((corner.x + 1) / 2) * width;
      const y = ((1 - corner.y) / 2) * height;
      left = Math.min(left, x);
      top = Math.min(top, y);
      right = Math.max(right, x);
      bottom = Math.max(bottom, y);
    }
    // Whole px, and only on change: a style write makes the page re-lay out.
    const transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
    const boxW = `${Math.round(right - left)}px`;
    const boxH = `${Math.round(bottom - top)}px`;
    if (anchor.style.display !== "block") anchor.style.display = "block";
    if (anchor.style.transform !== transform) anchor.style.transform = transform;
    if (anchor.style.width !== boxW) anchor.style.width = boxW;
    if (anchor.style.height !== boxH) anchor.style.height = boxH;
    if (anchor.getAttribute("href") !== hotspot.href) {
      anchor.href = hotspot.href;
      anchor.target = hotspot.href.startsWith("mailto:") ? "" : "_blank";
      anchor.setAttribute("aria-label", hotspot.label);
    }
  });

  return (
    <>
      <group>
        <RigidBody ref={fixed} {...segmentProps} type="fixed" />
        <RigidBody position={[SEGMENT * 0.7 * spread, 0, 0]} ref={j1} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[SEGMENT * 1.4 * spread, 0, 0]} ref={j2} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody position={[SEGMENT * 2.1 * spread, 0, 0]} ref={j3} {...segmentProps}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          position={[SEGMENT * 2.8 * spread, 0, 0]}
          ref={card}
          {...segmentProps}
          type={dragged ? "kinematicPosition" : "dynamic"}
        >
          <CuboidCollider args={[CARD_W / 2, CARD_H / 2, 0.01]} />
          <group
            onPointerOver={() => setHovered(true)}
            onPointerOut={() => {
              // Moving onto the link overlay also leaves the canvas. Its
              // pointerenter lands just after this, so check a frame later.
              pendingOut.current = true;
              requestAnimationFrame(() => {
                if (
                  !pendingOut.current ||
                  anchorRef.current?.matches(":hover")
                )
                  return;
                pendingOut.current = false;
                setHovered(false);
                setSpot(null);
              });
            }}
            onPointerMove={(e) => {
              e.stopPropagation(); // only the nearest face counts
              pendingOut.current = false;
              pointerType.current = e.nativeEvent.pointerType;
              if (dragged) return;
              const hit = hitSpot(e);
              setSpot((current) =>
                current?.id === hit?.hit.id && current?.side === hit?.side
                  ? current
                  : hit && { side: hit.side, id: hit.hit.id },
              );
            }}
            onPointerUp={(e) => {
              e.stopPropagation(); // only the nearest face counts
              (e.target as Element).releasePointerCapture(e.pointerId);
              setDragged(false);
              setPressed(null);
              // A tap (not a drag) on a link opens it.
              const down = pointerDown.current;
              pointerDown.current = null;
              if (
                down?.spot &&
                Math.hypot(e.clientX - down.x, e.clientY - down.y) < 6
              ) {
                openLink(down.spot.href);
              }
            }}
            onPointerDown={(e) => {
              e.stopPropagation(); // only the nearest face counts
              pointerType.current = e.nativeEvent.pointerType;
              (e.target as Element).setPointerCapture(e.pointerId);
              const hit = hitSpot(e);
              pointerDown.current = {
                x: e.clientX,
                y: e.clientY,
                spot: hit?.hit ?? null,
              };
              setPressed(hit && { side: hit.side, id: hit.hit.id });
              setDragged(
                new THREE.Vector3()
                  .copy(e.point)
                  .sub(vec.copy(card.current.translation())),
              );
            }}
          >
            <mesh geometry={cardGeometry.body} castShadow>
              <meshPhysicalMaterial
                color="#121212"
                clearcoat={SURFACE.clearcoat}
                clearcoatRoughness={SURFACE.clearcoatRoughness}
                roughness={SURFACE.roughness}
              />
            </mesh>
            {(
              [
                ["front", frontMesh, front, 0.0101, 0],
                ["back", backMesh, back, -0.0101, Math.PI],
              ] as const
            ).map(([side, ref, card, z, rotationY]) => (
              <mesh
                key={side}
                ref={ref}
                geometry={cardGeometry.face}
                castShadow
                position={[0, 0, z]}
                rotation={[0, rotationY, 0]}
                visible={!!card}
              >
                <meshPhysicalMaterial
                  map={card?.texture}
                  emissiveMap={card?.texture}
                  emissive="#ffffff"
                  emissiveIntensity={SURFACE.artworkGlow}
                  normalMap={cardGeometry.normalMap}
                  normalScale={RELIEF_SCALE}
                  roughness={SURFACE.roughness}
                  metalness={SURFACE.metalness}
                  clearcoat={SURFACE.clearcoat}
                  clearcoatRoughness={SURFACE.clearcoatRoughness}
                  toneMapped={false}
                />
                {highlightGeometry && (
                  <mesh
                    geometry={highlightGeometry}
                    // Not hit-testable, or hovering it would hide it again.
                    raycast={() => null}
                    visible={!!activeRow && active?.side === side}
                    position={
                      activeRow && activeFace
                        ? [
                            ((activeRow.x + activeRow.w / 2) / activeFace.face.width - 0.5) * CARD_W,
                            (0.5 - (activeRow.y + activeRow.h / 2) / activeFace.face.height) * CARD_H,
                            0.0005,
                          ]
                        : [0, 0, 0.0005]
                    }
                  >
                    <meshBasicMaterial
                      color="#ffffff"
                      transparent
                      opacity={pressed ? 0.14 : 0.08}
                      depthWrite={false}
                      toneMapped={false}
                    />
                  </mesh>
                )}
              </mesh>
            ))}
            {/* Metal clip */}
            <mesh position={[0, CARD_H / 2 + 0.08, 0]} castShadow>
              <boxGeometry args={[0.32, 0.2, 0.05]} />
              <meshStandardMaterial color="#c9c9c9" metalness={1} roughness={0.25} />
            </mesh>
            <mesh position={[0, CARD_H / 2 + 0.24, 0]} castShadow>
              <torusGeometry args={[0.07, 0.018, 12, 32]} />
              <meshStandardMaterial color="#c9c9c9" metalness={1} roughness={0.25} />
            </mesh>
          </group>
        </RigidBody>
      </group>
      <mesh
        ref={band}
        geometry={ribbon}
        frustumCulled={false}
        visible={!!strap}
        castShadow
      >
        <meshBasicMaterial map={strap} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
    </>
  );
}

/**
 * Light from the top-left front, casting a soft shadow of the card and strap
 * onto an invisible wall just behind them.
 */
function ShadowLight({ lite }: { lite: boolean }) {
  const [target] = useState(() => {
    const object = new THREE.Object3D();
    object.position.set(0, -2.4, 0);
    return object;
  });
  return (
    <>
      <primitive object={target} />
      <directionalLight
        position={[-3, 4, 10]}
        target={target}
        intensity={1}
        castShadow
        shadow-mapSize={lite ? [1024, 1024] : [2048, 2048]}
        shadow-radius={lite ? SURFACE.shadowSoftness / 2 : SURFACE.shadowSoftness}
        shadow-blurSamples={lite ? 8 : 16}
        shadow-bias={-0.0005}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
        shadow-camera-near={1}
        shadow-camera-far={30}
      />
      <mesh position={[0, -3, -0.4]} receiveShadow>
        <planeGeometry args={[40, 20]} />
        <shadowMaterial opacity={SURFACE.shadowOpacity} />
      </mesh>
    </>
  );
}

/**
 * `playKey` changes the first time the badge scrolls into view: the physics
 * scene is rebuilt, so the card is thrown in from its start pose. Later
 * scroll-ins don't replay it. While the badge is off-screen (`active` false)
 * rendering and physics are paused.
 */
export default function Lanyard({
  playKey,
  active,
  portrait,
  lowPower,
}: {
  playKey: number;
  active: boolean;
  portrait: boolean;
  /** Slow device (see lib/low-power): use the same lighter settings as phones. */
  lowPower: boolean;
}) {
  const lite = portrait || lowPower;
  const layout = useMemo(() => getCardLayout(portrait), [portrait]);
  const cardGeometry = useMemo(() => createCardGeometry(layout), [layout]);
  useEffect(
    () => () => {
      cardGeometry.body.dispose();
      cardGeometry.face.dispose();
      cardGeometry.normalMap.dispose();
    },
    [cardGeometry],
  );
  const front = useCardFace(createFrontFace, layout);
  const back = useCardFace(createBackFace, layout);
  const strap = useCanvasTexture(drawStrap, true);
  // State, not a ref: the scene mounts in R3F's own root, so Band must
  // re-run its setup once the element exists.
  const [link, setLink] = useState<HTMLAnchorElement | null>(null);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas
        camera={{ fov: FOV }}
        gl={{ alpha: true }}
        // Phones and slow devices: cap resolution so the GPU keeps up with the swing.
        dpr={lite ? [1, 1.5] : [1, 2]}
        shadows="variance"
        frameloop={active ? "always" : "demand"}
      >
        <PixelCamera />
        <ambientLight intensity={0.3} />
        <ShadowLight lite={lite} />
        {/* Paused off-screen: while the card still swings, physics asks for a new
            frame every step, which would keep the scene rendering unseen. */}
        <Physics
          key={`${playKey}-${portrait}`}
          gravity={[0, -40, 0]}
          timeStep={1 / 60}
          interpolate
          paused={!active}
        >
          <Band
            front={front}
            back={back}
            strap={strap}
            cardGeometry={cardGeometry}
            layout={layout}
            link={link}
          />
        </Physics>
        <Environment blur={0.75} environmentIntensity={SURFACE.reflections}>
          <Lightformer intensity={2} color="white" position={[0, -1, 5]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[-1, -1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={3} color="white" position={[1, 1, 1]} rotation={[0, 0, Math.PI / 3]} scale={[100, 0.1, 1]} />
          <Lightformer intensity={10} color="white" position={[-10, 0, 14]} rotation={[0, Math.PI / 2, Math.PI / 3]} scale={[100, 10, 1]} />
        </Environment>
      </Canvas>
      {/* Hidden until a link row is hovered; positioned by Band. */}
      <a
        ref={setLink}
        rel="noopener noreferrer"
        tabIndex={-1}
        draggable={false}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          display: "none",
          cursor: "pointer",
        }}
      />
    </div>
  );
}
