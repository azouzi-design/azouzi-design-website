# Business card (hanging badge)

The 3D business card hanging from an `AZOUZI.DESIGN` lanyard below the
homepage. You can drag and throw it, flip it to see the back, and tap the
contact links printed on it. It's built with three.js (via React Three Fiber)
and Rapier physics.

Read this before changing anything in this folder. Most of the rules below
come from bugs that have already shipped once.

## Files

| File | Role |
| --- | --- |
| `badge.tsx` | Page-side wrapper. Reserves the section's height, decides **when** to build the 3D scene and whether to use the light version, and replays the entrance each time the badge scrolls into view. Loads `lanyard.tsx` with `ssr: false`. |
| `lanyard.tsx` | The 3D scene: camera, lights, shadow, physics bodies (`Band`), strap ribbon, drag/hover/tap handling. |
| `lanyard-layout.ts` | Every size: card size per layout, strap length, the px↔world scale, and the section height. Shared by the page and the scene. |
| `card-faces.ts` | Draws the front and back artwork onto 2D canvases (used as textures), defines the contact links and their tap areas, and loads fonts. |
| `card-surface.ts` | The physical look: rounded geometry, the procedural satin normal map, and the `SURFACE` material settings. |
| `src/lib/low-power.ts` | Decides once per visit whether the device is slow, by measuring the first second of frames. |
| `public/images/card-front-decorator.svg`, `card-back-decorator.svg` | Name artwork drawn onto the faces. |

It's mounted once, in `src/components/app-shell.tsx`, **on the home page only**
(`isHome && <Badge />`), below the main white card.

Design source: the Figma frames "card-front" (825:110) and "card-back" (825:194).

## Lifecycle

1. **The section reserves its space right away.** The `<section id="business-card">`
   gets a fixed `height` from `getCardLayout(portrait).areaHeightPx` (strap +
   card + 200px bottom margin), so the page never shifts when the scene loads.
2. **The scene is built late, on purpose.** Three.js, the Rapier WASM, the
   textures and the shader compiles are heavy enough to make the page-load
   animations stutter. `Lanyard` is only mounted once **either**:
   - 4s have passed since page load (`INTRO_END_MS`) and the browser is idle
     (`requestIdleCallback`, with a 1s timeout; older Safari doesn't have it
     and builds straight away), **or**
   - the badge comes within 300px of the viewport (`PRELOAD_MARGIN_PX`).

   `lowPower` is read at that moment (`isLowPower()`) and stays fixed for the
   visit.
3. **The entrance replays on every scroll-in.** An IntersectionObserver
   (triggering once 200px of the section is on screen, `TRIGGER_PX`) bumps
   `playKey`. `<Physics key={playKey-portrait}>` then remounts, so all the
   bodies spawn again at their start pose and the card is thrown in again.
   Textures and geometry live in `Lanyard`, above `Physics`, so a replay costs
   almost nothing.
4. **Nothing runs while off-screen.** `active` false sets the canvas
   `frameloop="demand"` **and** `Physics paused`. Both are needed: a swinging
   card makes physics request new frames, which would keep rendering unseen.

## Layout and coordinates

- **`PX_PER_UNIT = 190`**: one world unit is always 190 CSS px.
  `PixelCamera` moves the camera back by an amount based on the canvas height,
  so sizes in world units map exactly to screen pixels at any viewport size.
  The strap's anchor (the fixed body at the world origin) is at the **top
  edge of the canvas**.
- **Two layouts**, picked by `(max-width: 460px)` (`PORTRAIT_MAX_WIDTH`):

  | | Card (px) | Strap segment | Strap total | Throw spread |
  | --- | --- | --- | --- | --- |
  | Landscape (desktop/tablet) | 428 × 245 (3.5 × 2 in ratio) | 0.5 u | 285px | 1 |
  | Portrait (phones) | 348 × 232 | 0.3 u (40% shorter) | 171px | 0.4 |

- Every size comes from `lanyard-layout.ts`. Changing `PORTRAIT_H`,
  `PORTRAIT_W` or the segment length automatically updates the canvas
  textures, tap areas, colliders, the joint between card and strap, and the
  section height. Don't hard-code a size anywhere else.
- **Card height only changes the empty middle of the face.** On the front,
  the name artwork is pinned to the top and the links block to the bottom
  (14.5px from the edge, as in Figma). Shrinking the card closes the gap
  between them. Below about 180px tall they would overlap: the name takes
  about 36px and the links about 138px.
- Switching layout (rotating a phone, resizing across 460px) rebuilds the
  geometry and the face textures (`useMemo` on `layout`), and remounts
  `Physics` (its key includes `portrait`).

## Physics

- Chain: `fixed` (anchor) → `j1` → `j2` → `j3`, joined by **rope joints**
  (maximum distance = segment length). `j3` connects to the card with a
  **spherical joint** at `CARD_H/2 + CLIP` above the card's centre (`CLIP`
  = 0.3).
- Gravity is `-40` (strong, for a snappy swing). Linear and angular damping
  are 2. The time step is fixed at 1/60 with interpolation.
- **Start pose:** the bodies spawn in a horizontal line to the right of the
  anchor (`SEGMENT × 0.7/1.4/2.1/2.8 × spread`), and gravity swings them
  down. That swing is the "throw". On phones `spread = 0.4`: with the
  desktop spread the card started off-screen and swung past both edges.
- **Turn back to face the viewer:** each frame removes part of the card's
  y-rotation (`ang.y - rot.y * 0.25`), so a flipped card slowly turns back.
- **Strap smoothing:** `j1` and `j2` follow their physics positions through
  a lerp so the strap doesn't jitter. **The lerp factor is capped at 1.**
  Without the cap, slow phone frames (large `delta`) overshoot and the
  strap whips around.

## The strap

- It's a flat ribbon mesh (`updateRibbon`), rebuilt every frame along a
  Catmull-Rom curve (`chordal`) through anchor → j1 → j2 → j3. Its UVs follow
  the real length along the curve, so the text keeps its proportions however
  the strap bends.
- The curve starts `STRAP_OVERHANG` (1.5 u) **above** the canvas, out of
  view, so the strap's shadow (cast downwards by the light) still reaches the
  top edge.
- The texture is one `AZOUZI.DESIGN` tile drawn on a canvas, repeated along
  the strap. Text runs from top to bottom.

## Card faces

- Each face is a 2D canvas drawn at 3× the card's px size (`SCALE`), used as
  both `map` and `emissiveMap` (`artworkGlow` keeps the Figma colours
  readable whatever the lighting).
- **Front:** name artwork at the top right; contact links pinned to the
  bottom in two blocks (call/email/WhatsApp, then X/LinkedIn), labels on the
  left and values on the right with a dotted underline. X has the
  "Active Daily" badge.
- **Back:** the two title lines at the top left, and the wide name artwork
  along the bottom.
- **Contact data lives in `contactBlocks` in `card-faces.ts`.** It must match
  the site's contact details (and the `azouzi-design-context` skill).
- **Hover/press redraws the canvas:** `render({hover, pressed})` re-runs and
  sets `texture.needsUpdate`. Tap areas are rectangles in face px, matched
  against the raycast UV (`hotspotAt`).

### Font loading (the Android blank-card bug)

`loadFont()` waits for **only the primary family** (`Geist`) and **never
rejects**. Don't change it back to `document.fonts.load(fullFontStack)`:

- The body font stack includes `next/font`'s `"Geist Fallback"`, which is
  `src: local(Arial)`. **Android has no Arial**, so that face fails, and one
  failed face rejects the whole `fonts.load()` promise.
- The face and strap meshes are `visible={!!texture}`. If texture creation
  rejects, they never appear and you get a **plain black card with no strap**.
  Desktop and iOS have Arial, so the bug only showed up on Android.
- Texture promises end in `console.error` handlers, so a failure like this
  appears in the console instead of failing silently.

## Interaction

- **Drag:** pointer-down on the card switches it to `kinematicPosition` and
  stores the grab offset. Each frame, the pointer is projected onto the z = 0
  plane and the card follows it. On release it becomes dynamic again and
  swings.
- **Tap on a link:** opens only if the pointer moved **less than 6px**
  between down and up, so a drag that starts on a link doesn't open it.
  `mailto:` uses `location.href`; everything else opens in a new tab.
- **Releasing on touch:** a touch that turns into a page scroll ends with
  `pointercancel`, often outside the card, not `pointerup`. While dragging,
  window-level `pointercancel`/`pointerup` listeners release the card.
  **Don't remove them:** without them the card stays grabbed and jumps to
  wherever the finger moves next. This was the "too sensitive, flies
  off-screen" phone bug.
- The canvas doesn't set `touch-action`, so page scrolling over the badge
  still works on phones. Vertical swipes scroll the page; horizontal ones
  can drag the card.
- Cursor: `grab` / `grabbing` / `pointer` over a link, set on `body` while
  hovered.

## Performance tiers

`lite = portrait || lowPower`. The light version uses:

| | Full | Lite |
| --- | --- | --- |
| Resolution (DPR) | up to 2 | up to 1.5 |
| Shadow map | 2048² | 1024² |
| Shadow blur radius / samples | 14 / 16 | 7 / 8 (same visual softness at half resolution) |

`lowPower` comes from `src/lib/low-power.ts`. It's true if the browser hints
at a low-end device (Save-Data, ≤ 2 GB memory, ≤ 2 cores), or if more than
30% of the frames in the first second take longer than 25ms. The heaviest
remaining cost is the `meshPhysicalMaterial` clearcoat and the VSM shadow;
those are the next things to cut if phones lag again.

## Look

The settings are in `SURFACE` in `card-surface.ts`: corner radius (in px),
satin relief strength, roughness/metalness/clearcoat, artwork glow,
reflection strength, and shadow opacity/softness. The satin relief is a
procedural normal map with a fixed random seed, so the card looks the same on
every visit.

## Common changes

| To change… | Edit |
| --- | --- |
| Phone card size | `PORTRAIT_W` / `PORTRAIT_H` in `lanyard-layout.ts` |
| Desktop card size | `LANDSCAPE_W` (height follows the 1.75 ratio) |
| Strap length | `SEGMENT` (desktop) / `PORTRAIT_SEGMENT` (phones) |
| Phone/desktop breakpoint | `PORTRAIT_MAX_WIDTH` |
| Space below the card | `BOTTOM_MARGIN_PX` |
| How far it's thrown in from | `spread` in `Band` |
| Contact links / text on the card | `contactBlocks` / `createBackFace` in `card-faces.ts` |
| When the scene starts loading | `INTRO_END_MS`, `PRELOAD_MARGIN_PX` in `badge.tsx` |
| When the entrance plays | `TRIGGER_PX` in `badge.tsx` |
| Material / shadow look | `SURFACE` in `card-surface.ts` |

## Testing

- **Test on a real Android phone** for anything that touches fonts, textures,
  touch or performance. Desktop Chrome on a Mac has hidden every bug so far.
- To check the phone layout on desktop: load any page, replace the document
  with a 390px-wide `<iframe src="/">`, then scroll the iframe to
  `#business-card`. The iframe's `matchMedia` picks portrait. Resizing the
  window with browser automation hasn't worked reliably.
- A tab in the **background doesn't animate**: requestAnimationFrame is
  paused, so the canvas looks empty. Bring the tab to the front before
  judging a screenshot.
- To reproduce the Android font failure on desktop:
  `document.fonts.add(new FontFace("Geist Fallback", "local(NoSuchFont)"))`,
  then load the full body font stack. It rejects with `NetworkError`.
- Checklist after a change: the front, back and strap all show up; the
  entrance replays when you scroll away and back; dragging and throwing work;
  a link tap opens and a drag starting on a link doesn't; the card on phones
  settles fully on screen; nothing lags while scrolling past.
