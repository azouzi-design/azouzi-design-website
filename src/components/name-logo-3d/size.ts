// The artwork (public/images/name-logo.svg) is drawn at SVG_WIDTH x SVG_HEIGHT.
export const SVG_WIDTH = 171;
export const SVG_HEIGHT = 16;

// The header logo's size on the page, in px. In the scene one unit is one CSS
// pixel, so the 3D logo lands at exactly this size.
export const LOGO_HEIGHT = 20;
export const LOGO_WIDTH = (SVG_WIDTH * LOGO_HEIGHT) / SVG_HEIGHT;
// The header canvas is larger than the logo, so turning letters never clip.
export const CANVAS_WIDTH = 300;
export const CANVAS_HEIGHT = 90;
