import * as THREE from "three";

// Look of the physical card. Tweak here.
export const SURFACE = {
  /** Corner radius in on-screen CSS px. */
  cornerRadiusPx: 20,
  /** Strength of the wavy satin relief that catches the light. */
  reliefStrength: 0.35,
  roughness: 0.62,
  metalness: 0.15,
  clearcoat: 0.45,
  clearcoatRoughness: 0.32,
  /** How much the artwork glows on its own, so Figma colours stay readable. */
  artworkGlow: 0.75,
  /** Overall strength of the studio reflections. */
  reflections: 0.45,
  /** Soft drop shadow on the page behind the card. */
  shadowOpacity: 0.22,
  shadowSoftness: 14,
};

function roundedRect(w: number, h: number, r: number) {
  const x = -w / 2;
  const y = -h / 2;
  const shape = new THREE.Shape();
  shape.moveTo(x + r, y);
  shape.lineTo(x + w - r, y);
  shape.quadraticCurveTo(x + w, y, x + w, y + r);
  shape.lineTo(x + w, y + h - r);
  shape.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  shape.lineTo(x + r, y + h);
  shape.quadraticCurveTo(x, y + h, x, y + h - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);
  return shape;
}

/** Flat rounded face whose UVs span the full card (0–1), like a plane. */
export function createFaceGeometry(w: number, h: number, r: number) {
  const geometry = new THREE.ShapeGeometry(roundedRect(w, h, r), 12);
  const position = geometry.getAttribute("position");
  const uv = geometry.getAttribute("uv") as THREE.BufferAttribute;
  for (let i = 0; i < position.count; i++) {
    uv.setXY(i, position.getX(i) / w + 0.5, position.getY(i) / h + 0.5);
  }
  return geometry;
}

/** Card body: the rounded shape extruded to the card's thickness. */
export function createBodyGeometry(
  w: number,
  h: number,
  r: number,
  depth: number,
) {
  const geometry = new THREE.ExtrudeGeometry(roundedRect(w, h, r), {
    depth,
    bevelEnabled: false,
    curveSegments: 12,
  });
  geometry.translate(0, 0, -depth / 2);
  return geometry;
}

/**
 * Procedural normal map: soft diagonal waves (the moving light bands) plus
 * fine grain, so reflections shimmer across the card as it swings.
 */
export function createSurfaceNormalMap(width = 512, height = 364) {
  const heightField = new Float32Array(width * height);
  // Deterministic noise so every visit looks the same.
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const u = x / width;
      const v = y / height;
      const warp = 0.9 * Math.sin(v * Math.PI * 2 * 1.3 + u * 2.1);
      const waves = Math.sin((u + v * 0.55) * Math.PI * 2 * 2.5 + warp);
      heightField[y * width + x] = waves * 0.85 + (random() - 0.5) * 0.3;
    }
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const image = ctx.createImageData(width, height);
  const at = (x: number, y: number) =>
    heightField[((y + height) % height) * width + ((x + width) % width)];
  const strength = 6;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength;
      const dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const length = Math.hypot(dx, dy, 1);
      const i = (y * width + x) * 4;
      image.data[i] = ((-dx / length) * 0.5 + 0.5) * 255;
      image.data[i + 1] = ((dy / length) * 0.5 + 0.5) * 255;
      image.data[i + 2] = ((1 / length) * 0.5 + 0.5) * 255;
      image.data[i + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  return texture;
}
