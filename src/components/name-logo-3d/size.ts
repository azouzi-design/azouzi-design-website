// The artwork (public/images/name-logo.svg) is drawn at SVG_WIDTH x SVG_HEIGHT.
export const SVG_WIDTH = 171;
export const SVG_HEIGHT = 16;

// The header logo's size on the page, in px. In the scene one unit is one CSS
// pixel, so the 3D logo lands at exactly this size. The artwork is a pixel
// font 14 cells tall: 21px or 28px put each cell on whole device pixels on a
// 2x screen (sharpest face-on); 22px trades a little of that for size.
export const LOGO_HEIGHT = 22;
export const LOGO_WIDTH = (SVG_WIDTH * LOGO_HEIGHT) / SVG_HEIGHT;
// On phones (below the sm breakpoint, 640px) the logo is a little smaller:
// 21px, sharp on a 2x screen, and it leaves room for the menu button beside it.
export const PHONE_LOGO_HEIGHT = 21;
export const PHONE_QUERY = "(max-width: 639.98px)";
// The header canvas is larger than the logo, so turning letters never clip.
export const CANVAS_WIDTH = 360;
export const CANVAS_HEIGHT = 104;
