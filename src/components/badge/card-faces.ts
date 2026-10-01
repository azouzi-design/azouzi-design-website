// Draws the badge front/back (Figma "card-front" 825:110, "card-back" 825:194)
// onto canvases used as textures, and exposes their clickable areas.

import { SURFACE } from "./card-surface";

export const FACE_W = 428;
export const FACE_H = 304;
const SCALE = 3;

const BG = "#121212";
const WHITE = "#ffffff";
const GRAY_600 = "#a8a8a8";

export type FaceState = { hover: string | null; pressed: string | null };

export type Hotspot = {
  id: string;
  href: string;
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

function fontFamily() {
  return getComputedStyle(document.body).fontFamily;
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

function createCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = FACE_W * SCALE;
  canvas.height = FACE_H * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);
  return { canvas, ctx };
}

export type CardFace = {
  canvas: HTMLCanvasElement;
  hotspots: Hotspot[];
  render: (state: FaceState) => void;
};

export async function createFrontFace(): Promise<CardFace> {
  const family = fontFamily();
  await Promise.all([
    document.fonts.load(`400 14px ${family}`),
    document.fonts.load(`500 14px ${family}`),
    document.fonts.load(`500 10px ${family}`),
  ]);
  const [photo, decorator] = await Promise.all([
    loadImage("/images/azouzi.jpg"),
    loadImage("/images/card-front-decorator.svg"),
  ]);
  const { canvas, ctx } = createCanvas();

  // Layout: contact-links is 404 wide, centred, its centre 76px below the card's.
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
  const left = (FACE_W - 404) / 2;
  const right = left + 404;
  const rows: (Row & { y: number })[] = [];
  let y = FACE_H / 2 + 76 - totalHeight / 2;
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
    x: left - ROW_PAD_X,
    y: row.y - ROW_PAD_Y,
    w: 404 + ROW_PAD_X * 2,
    h: line.height + ROW_PAD_Y * 2,
  }));

  function render({ hover, pressed }: FaceState) {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, FACE_W, FACE_H);

    ctx.drawImage(decorator, 203, FACE_H - 272 - 20, 213, 20);

    // image-azouzi: 96×96, 6px from the top-left. Radius is concentric with
    // the card corner (card radius − inset) so the two curves run parallel.
    const size = 96;
    const px = 6;
    const py = 6;
    const radius = SURFACE.cornerRadiusPx - Math.min(px, py);
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.12)";
    ctx.shadowOffsetX = 3 * SCALE;
    ctx.shadowOffsetY = 5 * SCALE;
    ctx.shadowBlur = 12 * SCALE;
    ctx.fillStyle = BG;
    ctx.beginPath();
    ctx.roundRect(px, py, size, size, radius);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(px, py, size, size, radius);
    ctx.clip();
    const pw = size * 1.107;
    ctx.drawImage(photo, px - size * 0.0396, py, pw, size);
    ctx.restore();

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
        ctx.fillStyle = "#323232";
        ctx.beginPath();
        ctx.roundRect(bx, by, bw, bh, 2);
        ctx.fill();
        ctx.fillStyle = GRAY_600;
        ctx.fillText(row.badge, bx + 4, by + 1 + badgeLine.ascent);
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
  return { canvas, hotspots, render };
}

export async function createBackFace(): Promise<CardFace> {
  const family = fontFamily();
  await document.fonts.load(`400 14px ${family}`);
  const decorator = await loadImage("/images/card-back-decorator.svg");
  const { canvas, ctx } = createCanvas();

  function render() {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, FACE_W, FACE_H);
    ctx.drawImage(decorator, 12, FACE_H - 12 - 38, 404, 38);

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
  return { canvas, hotspots: [], render };
}

export function hotspotAt(face: CardFace, uv: { x: number; y: number }) {
  const x = uv.x * FACE_W;
  const y = (1 - uv.y) * FACE_H;
  return (
    face.hotspots.find(
      (h) => x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h,
    ) ?? null
  );
}
