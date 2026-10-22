"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useReducedMotion } from "framer-motion";
import { useState } from "react";
import { linkClasses } from "@/lib/styles";
import { LOOKS, type Look } from "./looks";
import { LOGO_HEIGHT } from "./size";

// WebGL is browser-only.
const Scene = dynamic(() => import("./scene"), { ssr: false });

// Cards show the logo larger than in the header, so details read; the toggle
// switches them to the header's real size.
const PREVIEW_LOGO_HEIGHT = 32;

const SIZES = [
  { label: "Large", height: PREVIEW_LOGO_HEIGHT },
  { label: `Header size (${LOGO_HEIGHT}px)`, height: LOGO_HEIGHT },
];

// Newest round first.
const ROUNDS = [...new Set(LOOKS.map((look) => look.round))].sort((a, b) => b - a);

function Card({ look, logoHeight, reduced }: { look: Look; logoHeight: number; reduced: boolean }) {
  return (
    <figure className="flex flex-col overflow-clip rounded-(--card-radius) bg-background-100 shadow-[inset_0_0_0_1px_var(--ds-stroke)]">
      <div className="h-[200px]">
        <Scene look={look.id} logoHeight={logoHeight} reduced={reduced} />
      </div>
      <figcaption className="flex flex-col gap-1 px-5 pb-5">
        <p className="font-semibold">{look.name}</p>
        <p className="text-gray-700">{look.note}</p>
      </figcaption>
    </figure>
  );
}

/** The /concept/logo page: every 3D direction for the name logo, by round. */
export function LogoLab() {
  const reduced = useReducedMotion() ?? false;
  const [logoHeight, setLogoHeight] = useState(PREVIEW_LOGO_HEIGHT);
  const [openRounds, setOpenRounds] = useState<number[]>([]);

  return (
    <div
      data-concept
      className="min-h-svh bg-concept-background px-4 py-16 text-[15px] tracking-[-0.15px] text-gray-1000 [&_p]:leading-[normal]"
    >
      <header className="mx-auto mb-10 flex max-w-[1200px] flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-semibold">Logo directions</h1>
          <p className="text-gray-700">
            Ways the name could live in 3D. Each one moves and reacts to your
            pointer as it would in the header.{" "}
            <Link href="/" className={linkClasses}>
              Back to the site
            </Link>
          </p>
        </div>
        <div className="flex gap-1 self-start rounded-[12px] bg-concept-track p-1">
          {SIZES.map(({ label, height }) => (
            <button
              key={height}
              type="button"
              aria-pressed={logoHeight === height}
              onClick={() => setLogoHeight(height)}
              className="h-8 cursor-pointer rounded-[8px] px-3 text-[13px] font-medium aria-pressed:bg-background-100"
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      {ROUNDS.map((round, i) => {
        const cards = (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LOOKS.filter((look) => look.round === round).map((look) => (
              <Card key={look.id} look={look} logoHeight={logoHeight} reduced={reduced} />
            ))}
          </div>
        );
        // The latest round is open; earlier ones fold away, and only build
        // their scenes once opened (each card is its own WebGL context).
        return i === 0 ? (
          <section key={round} className="mx-auto mb-12 flex max-w-[1200px] flex-col gap-4">
            <h2 className="font-semibold">Round {round}</h2>
            {cards}
          </section>
        ) : (
          <details
            key={round}
            className="mx-auto mb-6 max-w-[1200px]"
            onToggle={(event) => {
              const isOpen = event.currentTarget.open;
              setOpenRounds((rounds) =>
                isOpen ? [...rounds, round] : rounds.filter((r) => r !== round),
              );
            }}
          >
            <summary className="mb-4 cursor-pointer font-semibold text-gray-700">
              Round {round}
            </summary>
            {openRounds.includes(round) && cards}
          </details>
        );
      })}
    </div>
  );
}

