// Draws the badge front/back (Figma "card-front" 825:110, "card-back" 825:194)
// onto canvases used as textures, and exposes their clickable areas.

import type { CardLayout } from "./lanyard-layout";

const SCALE = 3;
/** Margin between the card edge and its content. */
const EDGE = 12;

const BG = "#121212";
const WHITE = "#ffffff";
const GRAY_600 = "#a8a8a8";

export type FaceState = { hover: string | null; pressed: string | null };

export type Hotspot = {
  id: string;
  href: string;
  /** Accessible name, e.g. "Email: hello@azouzi.design". */
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
};

type Row = {
  id: string;
  label: string;
  value: string;
  href: string;
  badge?: string;
};

const contactBlocks: Row[][] = [
  [
    {
      id: "call",
      label: "Book a call",
      value: "cal.com/azouzi-design/30min",
      href: "https://cal.com/azouzi-design/30min",
    },
    {
      id: "email",
      label: "Email",
      value: "hello@azouzi.design",
      href: "mailto:hello@azouzi.design",
    },
    {
      id: "whatsapp",
      label: "Whatsapp",
      value: "(+216) 58 289 199",
      href: "https://wa.me/21658289199",
    },
  ],
  [
    {
      id: "x",
      label: "X",
      value: "x.com/azouzidesign",
      href: "https://x.com/azouzidesign",
      badge: "Active Daily",
    },
    {
      id: "linkedin",
      label: "Linkedin",
      value: "linkedin.com/in/azouzi",
      href: "https://linkedin.com/in/azouzi",
    },
  ],
];

// Hover/press tint covering the whole contact-link row.
const ROW_PAD_X = 6;
const ROW_PAD_Y = 3;

function loadImage(src: string) {
  const image = new Image();
  image.src = src;
  return image.decode().then(() => image);
}

export function fontFamily() {
  return getComputedStyle(document.body).fontFamily;
}

/**
 * Waits for the page font before drawing with it. Only the primary family is
 * loaded: the font stack also lists next/font's "Geist Fallback", which is
 * `local(Arial)` and fails on Android (no Arial), and a single failed face
 * rejects the whole `fonts.load`. Never rejects; worst case the canvas
 * draws with a system font.
 */
export function loadFont(weight: number, size: number) {
  const primary = fontFamily().split(",")[0].trim();
  return document.fonts
    .load(`${weight} ${size}px ${primary}`)
    .catch(() => undefined);
}

function setFont(
  ctx: CanvasRenderingContext2D,
  weight: number,
  size: number,
  tracking: number,
) {
  ctx.font = `${weight} ${size}px ${fontFamily()}`;
  ctx.letterSpacing = `${tracking}px`;
}

/** CSS `line-height: normal` for the current font. */
function normalLineHeight(ctx: CanvasRenderingContext2D) {
  const m = ctx.measureText("Hg");
  return {
    height: m.fontBoundingBoxAscent + m.fontBoundingBoxDescent,
    ascent: m.fontBoundingBoxAscent,
  };
}

function dottedUnderline(
  ctx: CanvasRenderingContext2D,
  x1: number,
  x2: number,
  y: number,
  size: number,
) {
  const thickness = size * 0.1;
  for (let x = x1 + thickness / 2; x < x2; x += thickness * 2) {
    ctx.beginPath();
    ctx.arc(x, y, thickness / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function createCanvas({ pxW, pxH }: CardLayout) {
  const canvas = document.createElement("canvas");
  canvas.width = pxW * SCALE;
  canvas.height = pxH * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);
  return { canvas, ctx };
}

export type CardFace = {
  /** Face size in px, for converting UV hits to canvas coordinates. */
  width: number;
  height: number;
  canvas: HTMLCanvasElement;
  hotspots: Hotspot[];
  render: (state: FaceState) => void;
};

export async function createFrontFace(layout: CardLayout): Promise<CardFace> {
  const { pxW: FACE_W, pxH: FACE_H } = layout;
  await Promise.all([loadFont(400, 14), loadFont(500, 14), loadFont(500, 10)]);
  const decorator = await loadImage("/images/card-front-decorator.svg");
  const { canvas, ctx } = createCanvas(layout);

  // Layout: contact links span the card between the edge margins.
  const contentW = FACE_W - 2 * EDGE;
  setFont(ctx, 500, 14, -0.14);
  const line = normalLineHeight(ctx);
  const rowGap = 6;
  const blockGap = 20;
  const blockHeights = contactBlocks.map(
    (rows) => rows.length * line.height + (rows.length - 1) * rowGap,
  );
  const totalHeight =
    blockHeights.reduce((a, b) => a + b, 0) +
    blockGap * (contactBlocks.length - 1);
  const left = EDGE;
  const right = left + contentW;
  const rows: (Row & { y: number })[] = [];
  // Anchored to the bottom: 14.5px below the last row, as in the Figma frame.
  let y = FACE_H - 14.5 - totalHeight;
  contactBlocks.forEach((block, b) => {
    block.forEach((row, i) => {
      rows.push({ ...row, y });
      y += line.height + (i < block.length - 1 ? rowGap : 0);
    });
    if (b < contactBlocks.length - 1) y += blockGap;
  });

  const hotspots: Hotspot[] = rows.map((row) => ({
    id: row.id,
    href: row.href,
    label: `${row.label}: ${row.value}`,
    x: left - ROW_PAD_X,
    y: row.y - ROW_PAD_Y,
    w: contentW + ROW_PAD_X * 2,
    h: line.height + ROW_PAD_Y * 2,
  }));

  function render({ hover, pressed }: FaceState) {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, FACE_W, FACE_H);

    ctx.drawImage(decorator, FACE_W - EDGE - 213, 16, 213, 20);

    for (const row of rows) {
      const spot = hotspots.find((h) => h.id === row.id)!;
      if (hover === row.id || pressed === row.id) {
        ctx.fillStyle =
          pressed === row.id ? "rgba(255,255,255,0.14)" : "rgba(255,255,255,0.08)";
        ctx.beginPath();
        ctx.roundRect(spot.x, spot.y, spot.w, spot.h, 12);
        ctx.fill();
      }
      const baseline = row.y + line.ascent;

      setFont(ctx, 500, 14, -0.14);
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = WHITE;
      ctx.fillText(row.label, left, baseline);

      if (row.badge) {
        const labelW = ctx.measureText(row.label).width;
        setFont(ctx, 500, 10, -0.05);
        const badgeLine = normalLineHeight(ctx);
        const textW = ctx.measureText(row.badge).width;
        const bw = textW + 8;
        const bh = badgeLine.height + 2;
        const bx = left + labelW + 8;
        const by = row.y + (line.height - bh) / 2;
        ctx.save();
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "#323232";
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 2);
        ctx.fill();
        ctx.fillStyle = GRAY_600;
        ctx.fillText(row.badge, bx + 4, by + 1 + badgeLine.ascent);
        ctx.restore();
      }

      setFont(ctx, 400, 14, -0.14);
      ctx.textAlign = "right";
      const active = hover === row.id || pressed === row.id;
      ctx.fillStyle = active ? WHITE : GRAY_600;
      ctx.fillText(row.value, right, baseline);
      const valueW = ctx.measureText(row.value).width;
      dottedUnderline(ctx, right - valueW, right, baseline + 2.5, 14);
    }
  }

  render({ hover: null, pressed: null });
  return { width: FACE_W, height: FACE_H, canvas, hotspots, render };
}

export async function createBackFace(layout: CardLayout): Promise<CardFace> {
  const { pxW: FACE_W, pxH: FACE_H } = layout;
  await loadFont(400, 14);
  const decorator = await loadImage("/images/card-back-decorator.svg");
  const { canvas, ctx } = createCanvas(layout);
  // The name graphic spans the card width, keeping its 404 × 38 proportions.
  const decoratorW = FACE_W - 2 * EDGE;
  const decoratorH = (decoratorW * 38) / 404;

  function render() {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, FACE_W, FACE_H);
    ctx.drawImage(decorator, EDGE, FACE_H - EDGE - decoratorH, decoratorW, decoratorH);

    setFont(ctx, 400, 14, -0.14);
    const line = normalLineHeight(ctx);
    ctx.fillStyle = WHITE;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ["Senior product designer", "Design partner for AI founders"].forEach(
      (text, i) => ctx.fillText(text, 12, 12 + line.height * i + line.ascent),
    );
  }

  render();
  return { width: FACE_W, height: FACE_H, canvas, hotspots: [], render };
}

export function hotspotAt(face: CardFace, uv: { x: number; y: number }) {
  const x = uv.x * face.width;
  const y = (1 - uv.y) * face.height;
  return (
    face.hotspots.find(
      (h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h,
    ) ?? null
  );
}
