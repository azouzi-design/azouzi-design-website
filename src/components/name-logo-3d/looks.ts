// Visual directions for the 3D name logo, from the rounds of exploration.
// The header uses "enamel".

export type Look = {
  id: string;
  name: string;
  note: string;
  /** Which round of exploration it came from (the page groups by it). */
  round: number;
  material: "matte" | "chrome" | "ink" | "clay" | "prism" | "paper" | "acrylic" | "enamel";
  /** solid: extruded letters. wire: their edges only. layers: thin copies
   * stacked behind the face. voxels: one block per pixel of the artwork.
   * letters: each letter its own piece (see `letters`). tiles: the pixel grid
   * as two-sided tiles that flip. */
  build: "solid" | "wire" | "layers" | "voxels" | "letters" | "tiles";
  /** Extrusion depth, in the artwork's own units (it is 16 tall). */
  depth: number;
  bevel?: boolean;
  /** The whole logo. lean: idle sway, turns toward the pointer. turntable:
   * keeps turning. float: bobs gently. flip: somersaults now and then.
   * still: stays face-on. */
  motion: "lean" | "turntable" | "float" | "flip" | "still";
  /** Scales how far "lean" turns (1: the header's). */
  lean?: number;
  /** For build "letters". wave: a ripple of flips runs through them now and
   * then. magnetic: letters near the pointer lift toward it. */
  letters?: "wave" | "magnetic";
  /** Floats above the page, casting a soft shadow onto it. */
  shadow?: boolean;
  /** Lit by studio light strips (reflective materials) instead of lamps. */
  env?: boolean;
  /** Key light low and from the side, so faces stay flat and only edges
   * catch light: reads as pressed into paper. */
  rake?: boolean;
  /** Ambient and key light, for lamp-lit looks. */
  light?: [number, number];
};

export const LOOKS: Look[] = [
  // Round 3
  {
    id: "enamel",
    name: "Enamel",
    note: "Steel grey under a glossy clear lacquer, catching light strips. The header logo today.",
    round: 3,
    material: "enamel",
    build: "solid",
    depth: 4,
    // No bevel: on a pixel font it rounds every little step, and the gloss
    // then glints on each one.
    motion: "lean",
    env: true,
  },

  // Round 2
  {
    id: "emboss",
    name: "Emboss",
    note: "White on white: the letters are only there in the light and shade along their edges, like a pressed card.",
    round: 2,
    material: "paper",
    build: "solid",
    depth: 1.2,
    bevel: true,
    motion: "lean",
    lean: 0.5,
    rake: true,
    // Face just reaches white (ambient + the key's glancing share); sides
    // turned away from the key get ambient only, a shade darker.
    light: [2, 7.5],
  },
  {
    id: "floating",
    name: "Floating",
    note: "Thin letters hovering just off the page, with a soft shadow that shifts as you move.",
    round: 2,
    material: "matte",
    build: "solid",
    depth: 1.2,
    bevel: true,
    motion: "lean",
    lean: 0.35,
    shadow: true,
  },
  {
    id: "ripple",
    name: "Ripple",
    note: "Face-on and calm; every few seconds a flip runs through the letters, one after another.",
    round: 2,
    material: "matte",
    build: "letters",
    depth: 4,
    bevel: true,
    motion: "still",
    letters: "wave",
  },
  {
    id: "magnetic",
    name: "Magnetic",
    note: "Letters near the cursor rise toward it and turn to face it; the rest stay flat.",
    round: 2,
    material: "matte",
    build: "letters",
    depth: 4,
    bevel: true,
    motion: "still",
    letters: "magnetic",
  },
  {
    id: "tiles",
    name: "Flip tiles",
    note: "The pixel grid as two-sided tiles, like a departures board: they flip to black in a sweep, then back.",
    round: 2,
    material: "matte",
    build: "tiles",
    depth: 1,
    motion: "lean",
    lean: 0.3,
  },
  {
    id: "acrylic",
    name: "Acrylic",
    note: "A thick clear block: the face disappears, the edges hold the light.",
    round: 2,
    material: "acrylic",
    build: "solid",
    depth: 8,
    bevel: true,
    motion: "lean",
    env: true,
  },

  // Round 1
  {
    id: "matte",
    name: "Matte",
    note: "Soft grey, shallow, leans toward the pointer (the header's first 3D look).",
    round: 1,
    material: "matte",
    build: "solid",
    depth: 4,
    bevel: true,
    motion: "lean",
  },
  {
    id: "chrome",
    name: "Chrome",
    note: "Polished metal that catches light strips as it turns.",
    round: 1,
    material: "chrome",
    build: "solid",
    depth: 5,
    bevel: true,
    motion: "lean",
    env: true,
  },
  {
    id: "ink",
    name: "Glossy ink",
    note: "Black lacquer under a clear coat: a printed mark with a highlight.",
    round: 1,
    material: "ink",
    build: "solid",
    depth: 3,
    bevel: true,
    motion: "float",
    env: true,
  },
  {
    id: "clay",
    name: "Clay block",
    note: "Deep, chalky letters on a slow turntable, like a sculpted object.",
    round: 1,
    material: "clay",
    build: "solid",
    depth: 16,
    bevel: true,
    motion: "turntable",
    light: [1, 1.6],
  },
  {
    id: "voxels",
    name: "Pixels",
    note: "The artwork's pixel grid as separate blocks, with a wave running through.",
    round: 1,
    material: "matte",
    build: "voxels",
    depth: 3,
    motion: "lean",
  },
  {
    id: "layers",
    name: "Echo",
    note: "Thin copies stacked behind the face, fanning out as it leans.",
    round: 1,
    material: "matte",
    build: "layers",
    depth: 0.8,
    motion: "lean",
  },
  {
    id: "wire",
    name: "Wireframe",
    note: "Edges only: an outline drawn in space.",
    round: 1,
    material: "matte",
    build: "wire",
    depth: 6,
    motion: "turntable",
  },
  {
    id: "prism",
    name: "Prism",
    note: "Each face colored by the way it points, so the hue shifts as it flips.",
    round: 1,
    material: "prism",
    build: "solid",
    depth: 5,
    bevel: true,
    motion: "flip",
  },
];
