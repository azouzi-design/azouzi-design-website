// Shared by the page (to size the canvas) and the 3D scene.

// Fixed screen scale so sizes are exact in CSS pixels.
export const PX_PER_UNIT = 190;

// Strap: three rope segments (total strap length = 3 × SEGMENT).
export const SEGMENT = 0.5;
export const CLIP = 0.3; // card top -> strap attachment

const BOTTOM_MARGIN_PX = 200;

// Landscape business card (3.5 × 2 in) on wider screens, an upright card on
// narrow ones.
const LANDSCAPE_W = 428;
const PORTRAIT_W = 348;
const PORTRAIT_H = 400;
/** At or below this viewport width the portrait card is used. */
export const PORTRAIT_MAX_WIDTH = 460;

export type CardLayout = {
  portrait: boolean;
  /** Card size in on-screen px. */
  pxW: number;
  pxH: number;
  /** Card size in world units. */
  w: number;
  h: number;
  /** Height the lanyard needs: strap + card at rest + bottom margin. */
  areaHeightPx: number;
};

export function getCardLayout(portrait: boolean): CardLayout {
  const pxW = portrait ? PORTRAIT_W : LANDSCAPE_W;
  const pxH = portrait ? PORTRAIT_H : Math.round(pxW / 1.75);
  const h = pxH / PX_PER_UNIT;
  return {
    portrait,
    pxW,
    pxH,
    w: pxW / PX_PER_UNIT,
    h,
    areaHeightPx: Math.round(
      (3 * SEGMENT + CLIP + h) * PX_PER_UNIT + BOTTOM_MARGIN_PX,
    ),
  };
}
