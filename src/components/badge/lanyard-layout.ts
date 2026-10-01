// Shared by the page (to size the canvas) and the 3D scene.

// Card dimensions in world units, matching the 428×304 Figma frames
// (304px tall on screen at PX_PER_UNIT).
export const CARD_H = 1.6;
export const CARD_W = (CARD_H * 428) / 304;

// Strap: three rope segments (total strap length = 3 × SEGMENT).
export const SEGMENT = 0.5;
export const CLIP = 0.3; // card top -> strap attachment

// Fixed screen scale so sizes are exact in CSS pixels.
export const PX_PER_UNIT = 190;
const BOTTOM_MARGIN_PX = 200;

/** Height the lanyard needs: strap + card at rest + bottom margin. */
export const LANYARD_HEIGHT_PX = Math.round(
  (3 * SEGMENT + CLIP + CARD_H) * PX_PER_UNIT + BOTTOM_MARGIN_PX,
);
