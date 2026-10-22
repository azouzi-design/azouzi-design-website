// Scroll effects for the /concept page's project media: Drum on /concept
// (DEFAULT_EFFECT), the others on /concept/effects/<id>.
// Each is a pair of GLSL snippets dropped into the shared shaders in
// scene.tsx.
//
// What the snippets can use (all lengths in CSS px):
//   vertex:   vec4 world (move it), vec2 uv, float vEffect (pass a 0..1
//             amount to the fragment), uViewport, uSize, uZone, uProgress,
//             uVelocity, uTime, uDistance (camera to the z = 0 plane),
//             uInset (the effect's insetPx).
//             world.y is 0 mid-screen, up is positive.
//   fragment: vec2 uv (sample with it), vec3 color (set it), float alpha,
//             float vEffect, vAbove, uMap, uViewport, uSize, uZone, uProgress,
//             uVelocity, uTime, and float inset (0: full size; shrinks the
//             rounded mask by that share).
//   uProgress: 0 as the media's top edge crosses the screen's bottom edge,
//              1 once it's uZone above it. uVelocity: scroll speed, px per
//              frame, positive while scrolling down (smoothed).

export type Effect = {
  id: string;
  name: string;
  note: string;
  /** Height of the entry zone at the bottom of the screen, as a share of the
   * screen height: media are in full form once past it. */
  zone: number;
  /** The same in px, used instead of `zone` when set (stays the same at any
   * window height). */
  zonePx?: number;
  /** A clear margin (px) at the viewport's top and bottom that the media
   * never enter: the zone ends this far in from each edge. */
  insetPx?: number;
  vertex: string;
  fragment: string;
};

// Red and blue sampled apart along y, by `split` (uv units).
const splitSample = (split: string) => `
  vec2 offset = vec2(0.0, ${split});
  color = vec3(
    texture2D(uMap, uv + offset).r,
    texture2D(uMap, uv).g,
    texture2D(uMap, uv - offset).b
  );
`;

export const EFFECTS: Effect[] = [
  {
    id: "bend",
    name: "Bend",
    note: "Curls in from below the bottom edge and out past the top, tapering as it rolls away from you, with a faint color split; flat in between.",
    zone: 0.15,
    vertex: `
      // How far into the bottom or top zone this point is: 0 outside, 1 at
      // the screen's edge (and more beyond it).
      float above = world.y + uViewport.y * 0.5;
      float below = uViewport.y * 0.5 - world.y;
      float bend = max(max(0.0, 1.0 - above / uZone), max(0.0, 1.0 - below / uZone));
      bend *= bend;
      // Rolled back: at the edge it's twice the camera distance away, so it
      // narrows to half its width.
      float back = bend * uDistance;
      float outward = bend * uViewport.y * 0.08 * sign(world.y);
      world.z -= back;
      // Pushed back, perspective would pull it toward mid-screen: scale y so
      // it stays at its edge of the screen, and a little beyond.
      world.y = (world.y + outward) * (uDistance + back) / uDistance;
      vEffect = bend;
    `,
    fragment: splitSample("0.006 * min(vEffect, 1.0)"),
  },
  {
    id: "drum",
    name: "Drum",
    note: "Wraps over a drum near the top and bottom: flat in the middle, then rolling away, blurring and fading out, gone 12px before the viewport's edge.",
    zone: 0,
    zonePx: 60,
    insetPx: 12,
    vertex: `
      // The media's horizon sits uInset in from each edge; the flat middle
      // ends uZone before it. Past that, the media wraps around a drum of
      // radius uZone. s: how far along the drum's surface this point has gone.
      float edgeHalf = uViewport.y * 0.5 - uInset;
      float flatHalf = edgeHalf - uZone;
      float s = abs(world.y) - flatHalf;
      if (s > 0.0) {
        float angle = s / uZone;
        float back = uZone * (1.0 - cos(min(angle, 3.1416)));
        // Scaled up by the depth it's pushed back, so perspective doesn't
        // pull it in: the horizon lands exactly uInset from the edge.
        world.y = sign(world.y) * (flatHalf + uZone * sin(min(angle, 1.5708)))
          * (uDistance + back) / uDistance;
        world.z -= back;
        vEffect = angle;
      }
    `,
    fragment: `
      // A ring blur that grows as it turns away (up to ~10px).
      float soft = smoothstep(0.3, 1.5708, vEffect);
      vec2 reach = soft * 10.0 / uSize;
      // Two rings (full and half reach, offset), so it reads as a smooth
      // blur rather than ghosted copies.
      vec3 sum = texture2D(uMap, uv).rgb;
      for (int i = 0; i < 8; i++) {
        float a = float(i) * 0.7854;
        sum += texture2D(uMap, uv + vec2(cos(a), sin(a)) * reach).rgb;
        sum += texture2D(uMap, uv + vec2(cos(a + 0.3927), sin(a + 0.3927)) * reach * 0.5).rgb;
      }
      color = sum / 17.0;
      // Fades as it turns away, all the way out at the horizon.
      alpha *= 1.0 - smoothstep(0.6, 1.5708, vEffect);
      alpha *= 1.0 - step(1.5708, vEffect);
    `,
  },
  {
    id: "soft",
    name: "Soft",
    note: "A gentle version of Bend: only a slight curl at the edges, fading out as it goes, with no color split.",
    zone: 0.2,
    vertex: `
      float above = world.y + uViewport.y * 0.5;
      float below = uViewport.y * 0.5 - world.y;
      float bend = max(max(0.0, 1.0 - above / uZone), max(0.0, 1.0 - below / uZone));
      bend *= bend;
      // At the edge: a quarter of the camera distance back, so 80% wide.
      float back = bend * uDistance * 0.25;
      world.z -= back;
      world.y = world.y * (uDistance + back) / uDistance;
      vEffect = bend;
    `,
    fragment: `
      color = texture2D(uMap, uv).rgb;
      alpha *= 1.0 - min(vEffect, 1.0) * 0.7;
    `,
  },
  {
    id: "depth",
    name: "Depth",
    note: "No warping: near the top and bottom the whole image sits back, smaller, softly blurred and faded, easing to full size and focus mid-screen.",
    zone: 0.3,
    vertex: `
      // By where the media's middle is, not each point, so it stays flat.
      float middle = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).y;
      float edge = smoothstep(uViewport.y * 0.5 - uZone, uViewport.y * 0.5 + uSize.y * 0.25, abs(middle));
      world.z -= edge * uDistance * 0.18;
      vEffect = edge;
    `,
    fragment: `
      // A small ring blur, wider the closer to the edge.
      vec2 reach = vEffect * 6.0 / uSize;
      vec3 sum = texture2D(uMap, uv).rgb;
      for (int i = 0; i < 8; i++) {
        float a = float(i) * 0.7854;
        sum += texture2D(uMap, uv + vec2(cos(a), sin(a)) * reach).rgb;
      }
      color = sum / 9.0;
      alpha *= 1.0 - vEffect * 0.6;
    `,
  },
];

export const DEFAULT_EFFECT = "drum";

export function getEffect(id: string) {
  return EFFECTS.find((effect) => effect.id === id);
}
