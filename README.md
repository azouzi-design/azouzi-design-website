# azouzi.design

Personal portfolio site for Ahmed Azouzi, rebuilt from Figma, replacing the previous Framer site.

## The site

A single page (`src/components/home-page.tsx`, Figma "home-concept"):

- The 3D name at the top (`name-logo-3d/`), with **About & Services** and
  **Contact me** buttons. Each opens a blurred full-screen overlay: the intro,
  services and profile photo, or the hanging 3D business card (`badge/`).
- The picked project's content in the middle (`project-body.tsx`, data in
  `src/lib/projects.ts`). Its media are redrawn in WebGL and roll in and out at
  the screen's edges (`media-effects/`).
- The project switcher at the bottom. `?project=<id>` opens a project; the old
  `/projects/<id>` pages redirect there.

Explorations live at `/concept/logo` and `/concept/effects/<id>`.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://motion.dev) for overlays, the switcher and blur-ins
- [React Three Fiber](https://r3f.docs.pmnd.rs) for the 3D name, the media
  effects and the business card, plus [Rapier](https://rapier.rs) for the card's physics
- Deployed on [Vercel](https://vercel.com)

## Design tokens

Colors live in `src/app/globals.css` and mirror the Figma `ds/…` variables:

| Token | Value | Use |
| --- | --- | --- |
| `background-100` | `#ffffff` | Page, buttons |
| `background-200` | `#f6f6f6` | Image placeholders, video backdrop |
| `gray-700` | `#8f8f8f` | Links |
| `gray-1000` | `#171717` | Body text |
| `stroke` | `#ebebeb` | Button outline, image outlines |
| `concept-background` | `background-100` | Home page background, overlay veil |
| `concept-track` | `#f0f0f0` | Project switcher track |

Use the Tailwind classes they generate (`bg-background-100`, `text-gray-700`, …)
instead of raw hex values. Shared class strings (links, the outline button) are
in `src/lib/styles.ts`. Type is Geist, 15px with -0.15px tracking for body text.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
