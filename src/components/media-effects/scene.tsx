"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { DEFAULT_EFFECT, getEffect, type Effect } from "./effects";

// The project images and videos, redrawn in one full-screen canvas so a
// scroll effect (effects.ts) can shape them as they come in from the bottom
// edge. The page's own media stay in place, invisible, so layout, loading and
// playback are untouched.

const MEDIA = "[data-concept] main :is(img, video)";
const FOV = 30;
// Only draw media within this many screen heights of the screen.
const DRAW_MARGIN = 0.5;
// Scroll speed is clamped to this (px per frame), then smoothed.
const MAX_VELOCITY = 40;
const VELOCITY_DAMPING = 6;

const vertexShader = (effect: Effect) => /* glsl */ `
  uniform vec2 uViewport;
  uniform vec2 uSize;
  uniform float uZone;
  uniform float uProgress;
  uniform float uVelocity;
  uniform float uTime;
  uniform float uDistance;
  uniform float uInset;
  varying vec2 vUv;
  varying float vEffect;
  varying float vAbove;

  void main() {
    vUv = uv;
    vEffect = 0.0;
    vec4 world = modelMatrix * vec4(position, 1.0);
    // Height above the screen's bottom edge, in px (world y is 0 mid-screen).
    vAbove = world.y + uViewport.y * 0.5;
    // In its own block, so its names can't clash with the ones here.
    {
      ${effect.vertex}
    }
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = (effect: Effect) => /* glsl */ `
  uniform sampler2D uMap;
  uniform vec2 uViewport;
  uniform vec2 uSize;
  uniform float uZone;
  uniform float uProgress;
  uniform float uVelocity;
  uniform float uTime;
  uniform float uRadius;
  uniform float uStroke;
  uniform vec3 uStrokeColor;
  uniform bool uDecode;
  varying vec2 vUv;
  varying float vEffect;
  varying float vAbove;

  float roundedBox(vec2 p, vec2 halfSize, float r) {
    vec2 q = abs(p) - halfSize + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    vec2 uv = vUv;
    vec3 color = vec3(0.0);
    float alpha = 1.0;
    float inset = 0.0;
    // In its own block, so its names can't clash with the ones here.
    {
      ${effect.fragment}
    }
    // Video frames arrive still encoded for display (three.js doesn't decode
    // them like images): decode here, or they'd come out washed out.
    if (uDecode) color = sRGBTransferEOTF(vec4(color, 1.0)).rgb;

    // Rounded corners, like the page's media (shrunk by the effect's inset).
    vec2 p = (vUv - 0.5) * uSize;
    vec2 halfSize = uSize * 0.5 * (1.0 - inset);
    float d = roundedBox(p, halfSize, uRadius);
    float aa = fwidth(d);
    float mask = 1.0 - smoothstep(-aa, aa, d);

    // The thin outline some shots have.
    if (uStroke > 0.0) {
      float edge = 1.0 - smoothstep(uStroke - aa, uStroke + aa, -d);
      color = mix(color, uStrokeColor, edge);
    }

    gl_FragColor = vec4(color, mask * alpha);
    #include <colorspace_fragment>
  }
`;

/** One scene unit = one CSS pixel on the z = 0 plane, origin mid-screen. */
function PixelCamera() {
  const get = useThree((state) => state.get);
  const height = useThree((state) => state.size.height);
  useLayoutEffect(() => {
    const camera = get().camera as THREE.PerspectiveCamera;
    const distance = height / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    camera.position.set(0, 0, distance);
    camera.near = distance / 10;
    // Far enough for media rolled far back at the screen's edges.
    camera.far = distance * 20;
    camera.updateProjectionMatrix();
  }, [get, height]);
  return null;
}

type Media = HTMLImageElement | HTMLVideoElement;
/** Shared by every plane: smoothed scroll speed, and time. */
type Motion = { velocity: number; time: number };

function isReady(media: Media) {
  return media instanceof HTMLVideoElement
    ? media.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
    : media.complete && media.naturalWidth > 0;
}

/** One image or video, drawn where it sits on the page. */
function MediaPlane({
  media,
  effect,
  geometry,
  motion,
}: {
  media: Media;
  effect: Effect;
  geometry: THREE.PlaneGeometry;
  motion: React.RefObject<Motion>;
}) {
  const mesh = useRef<THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>>(null);
  // Keyed per element by the parent, so this never changes.
  const element = useRef(media);
  const viewport = useThree((state) => state.size);

  const uniforms = useMemo(
    () => ({
      uMap: { value: null as THREE.Texture | null },
      uViewport: { value: new THREE.Vector2() },
      uSize: { value: new THREE.Vector2() },
      uZone: { value: 0 },
      uProgress: { value: 0 },
      uVelocity: { value: 0 },
      uTime: { value: 0 },
      uRadius: { value: 0 },
      uStroke: { value: 0 },
      uStrokeColor: { value: new THREE.Color() },
      uDecode: { value: media instanceof HTMLVideoElement },
      uDistance: { value: 1 },
      uInset: { value: effect.insetPx ?? 0 },
    }),
    // Planes are keyed per element on a page with one effect, so this only
    // runs once.
    [media, effect.insetPx],
  );
  const shaders = useMemo(
    () => ({ vertex: vertexShader(effect), fragment: fragmentShader(effect) }),
    [effect],
  );

  // The texture, once the media has something to show; then the page's own
  // copy hides. Corner radius and outline are read from its wrapper (the
  // rounded, clipped box around it). The wrapper's blur-in fade is left out:
  // the effect is the entrance, so the media must show as it comes in.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const target = element.current;
    let texture: THREE.Texture | null = null;
    let cancelled = false;
    const show = (loaded: THREE.Texture) => {
      const material = mesh.current?.material;
      if (cancelled || !material) {
        loaded.dispose();
        return;
      }
      texture = loaded;
      // Images decode on upload; videos in the shader (uDecode).
      texture.colorSpace =
        target instanceof HTMLVideoElement ? THREE.NoColorSpace : THREE.SRGBColorSpace;
      // Images get mipmaps, so they stay smooth squeezed into the curl
      // (videos would have to rebuild them every frame).
      const still = !(target instanceof HTMLVideoElement);
      texture.generateMipmaps = still;
      texture.minFilter = still ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
      texture.anisotropy = 8;
      texture.needsUpdate = true;

      const wrapper = target.parentElement!;
      const box = getComputedStyle(wrapper);
      const outline = getComputedStyle(wrapper, "::after");
      material.uniforms.uMap.value = texture;
      material.uniforms.uRadius.value = parseFloat(box.borderTopLeftRadius) || 0;
      material.uniforms.uStroke.value = parseFloat(outline.borderTopWidth) || 0;
      material.uniforms.uStrokeColor.value.setStyle(outline.borderTopColor || "#ebebeb");
      target.style.opacity = "0";
      // The wrapper's own outline and shadow would stay put while this copy
      // moves; the shader draws the outline instead (see globals.css).
      wrapper.setAttribute("data-media-drawn", "");
      setReady(true);
    };
    // Videos draw from the element itself; images load their file (already
    // in the browser's cache) through three.js, which uploads it reliably.
    const create = () => {
      if (target instanceof HTMLVideoElement) show(new THREE.VideoTexture(target));
      else new THREE.TextureLoader().load(target.currentSrc || target.src, show);
    };
    const event = target instanceof HTMLVideoElement ? "loadeddata" : "load";
    if (isReady(target)) create();
    else target.addEventListener(event, create, { once: true });
    return () => {
      cancelled = true;
      target.removeEventListener(event, create);
      texture?.dispose();
      target.style.opacity = "";
      target.parentElement?.removeAttribute("data-media-drawn");
    };
  }, []);

  useFrame(() => {
    const plane = mesh.current;
    const wrapper = element.current.parentElement;
    if (!plane || !wrapper) return;
    const { width, height } = viewport;
    const rect = wrapper.getBoundingClientRect();
    const near = rect.bottom > -height * DRAW_MARGIN && rect.top < height * (1 + DRAW_MARGIN);
    plane.visible = ready && near;
    if (!plane.visible) return;

    plane.position.set(
      rect.left + rect.width / 2 - width / 2,
      height / 2 - (rect.top + rect.height / 2),
      0,
    );
    plane.scale.set(rect.width, rect.height, 1);
    const zone = effect.zonePx ?? height * effect.zone;
    const { uniforms: live } = plane.material;
    live.uViewport.value.set(width, height);
    live.uSize.value.set(rect.width, rect.height);
    live.uZone.value = zone;
    live.uProgress.value = THREE.MathUtils.clamp((height - rect.top) / zone, 0, 1);
    live.uVelocity.value = motion.current.velocity;
    live.uTime.value = motion.current.time;
    live.uDistance.value = height / 2 / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
  });

  return (
    <mesh ref={mesh} geometry={geometry} visible={false}>
      <shaderMaterial
        key={effect.id}
        vertexShader={shaders.vertex}
        fragmentShader={shaders.fragment}
        uniforms={uniforms}
        transparent
        depthTest={false}
      />
    </mesh>
  );
}

/** Keeps a plane for every image and video on the page, as the project
 * (and so the media) changes, and tracks scroll speed for them. */
function MediaPlanes({ effect }: { effect: Effect }) {
  const [media, setMedia] = useState<Media[]>([]);
  // Finely divided both ways, so bends and waves stay smooth.
  const geometry = useMemo(() => new THREE.PlaneGeometry(1, 1, 24, 48), []);
  useEffect(() => () => geometry.dispose(), [geometry]);

  const motion = useRef<Motion>({ velocity: 0, time: 0 });
  const lastScroll = useRef<number | null>(null);
  useFrame(({ clock }, delta) => {
    const scroll = window.scrollY;
    const moved = lastScroll.current === null ? 0 : scroll - lastScroll.current;
    lastScroll.current = scroll;
    // px per frame at 60fps, whatever the actual frame rate.
    const perFrame = THREE.MathUtils.clamp(
      moved / Math.max(delta * 60, 0.001),
      -MAX_VELOCITY,
      MAX_VELOCITY,
    );
    motion.current.velocity = THREE.MathUtils.damp(
      motion.current.velocity,
      perFrame,
      VELOCITY_DAMPING,
      delta,
    );
    motion.current.time = clock.getElapsedTime();
  });

  useEffect(() => {
    const scan = () => {
      const found = Array.from(document.querySelectorAll<Media>(MEDIA));
      setMedia((current) =>
        current.length === found.length && current.every((item, i) => item === found[i])
          ? current
          : found,
      );
    };
    scan();
    const main = document.querySelector("[data-concept] main");
    if (!main) return;
    const observer = new MutationObserver(scan);
    observer.observe(main, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  return media.map((item) => (
    <MediaPlane
      key={keyFor(item)}
      media={item}
      effect={effect}
      geometry={geometry}
      motion={motion}
    />
  ));
}

// A stable React key per element.
const keys = new WeakMap<Element, number>();
let nextKey = 0;
function keyFor(element: Element) {
  if (!keys.has(element)) keys.set(element, nextKey++);
  return keys.get(element)!;
}

export default function MediaEffectsScene({ effect: id = DEFAULT_EFFECT }: { effect?: string }) {
  const effect = getEffect(id) ?? getEffect(DEFAULT_EFFECT)!;
  return (
    <Canvas camera={{ fov: FOV }} dpr={[1, 2]} gl={{ alpha: true, antialias: true }}>
      <PixelCamera />
      <MediaPlanes effect={effect} />
    </Canvas>
  );
}
