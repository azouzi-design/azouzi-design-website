# azouzi.design

Personal portfolio site for Ahmed Azouzi — rebuilt from Figma, replacing the previous Framer site.

## Stack

- [Next.js](https://nextjs.org) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://motion.dev) for the animation layer
- [React Three Fiber](https://r3f.docs.pmnd.rs) + [Rapier](https://rapier.rs) for the hanging 3D badge
- Deployed on [Vercel](https://vercel.com)

## Design tokens

Colors live in `src/app/globals.css` and mirror the Figma `ds/…` variables
(`background-100/200`, `gray-600/700/1000`). Use the Tailwind classes they
generate (`bg-background-200`, `text-gray-700`, …) instead of raw hex values.

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).
