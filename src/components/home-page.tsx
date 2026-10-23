"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { IntroBlock, ServicesBlock } from "@/components/about-blocks";
import { Badge } from "@/components/badge/badge";
import { ProfilePhoto } from "@/components/profile-photo";
import { MediaEffects } from "@/components/media-effects/media-effects";
import { NameLogo3D } from "@/components/name-logo-3d/name-logo-3d";
import { ProjectBody } from "@/components/project-body";
import { getProject, type Project } from "@/lib/projects";
import { appearAfter, outlineButtonClasses } from "@/lib/styles";
import { useScrollBoost } from "@/lib/use-scroll-boost";

/**
 * The home page (Figma "home-concept"): the name and two buttons at the top,
 * the project switcher at the bottom, and between them the content of the
 * picked project, whose media roll in and out at the screen's edges.
 */

// Switcher order, as in the Figma frame. Misc. has its own logo cut at this
// size; the others reuse the project logo at 16px tall.
export const TABS: { id: string; logo?: string; width?: number }[] = [
  { id: "misc", logo: "/images/logo-misc-switcher.svg", width: 54.492 },
  { id: "stint" },
  { id: "cynoia" },
  { id: "thunders" },
];
export const LOGO_HEIGHT = 16;

// The edge treatment from dmcg.co: three backdrop blurs, each masked to an
// overlapping band that sits nearer the edge the stronger it is, under a wash
// of the page color that fades inward.
const EDGE_BLURS = [
  { blur: 1.5, band: "transparent 0%, #000 25%, #000 50%, transparent 75%" },
  { blur: 5, band: "transparent 25%, #000 50%, #000 75%, transparent 100%" },
  { blur: 14, band: "transparent 50%, #000 75%, #000 100%, transparent 125%" },
];

/** Page color at a given opacity, as [percent, stop] pairs. */
function wash(stops: [number, number][]) {
  return stops
    .map(([alpha, at]) => `color-mix(in srgb, var(--ds-concept-background) ${alpha}%, transparent) ${at}%`)
    .join(", ");
}

// The top fades out slowly over its taller band; the bottom more quickly.
const EDGES = {
  top: {
    height: 128,
    wash: wash([[100, 0], [97, 10], [90, 20], [78, 30], [65, 40], [50, 50], [35, 60], [22, 70], [10, 80], [3, 90], [0, 100]]),
  },
  bottom: {
    height: 91,
    wash: wash([[100, 0], [88, 22], [55, 52], [18, 80], [0, 100]]),
  },
};

// Switched off for now while trying the page without it.
const SHOW_EDGE_BLUR = false;

/**
 * A progressive blur along one edge of the screen, behind its bar. `edge` is
 * the side of the screen it sits on.
 */
function EdgeBlur({ edge }: { edge: "top" | "bottom" }) {
  if (!SHOW_EDGE_BLUR) return null;

  // Masks run from the inner side out to the edge; the wash from the edge in.
  const outward = edge === "top" ? "to top" : "to bottom";
  const inward = edge === "top" ? "to bottom" : "to top";
  const { height, wash } = EDGES[edge];

  return (
    <div
      aria-hidden
      className={`pointer-events-none absolute inset-x-0 ${edge === "top" ? "top-0" : "bottom-0"}`}
      style={{ height }}
    >
      {EDGE_BLURS.map(({ blur, band }) => {
        const mask = `linear-gradient(${outward}, ${band})`;
        const style: CSSProperties = {
          backdropFilter: `blur(${blur}px)`,
          WebkitBackdropFilter: `blur(${blur}px)`,
          maskImage: mask,
          WebkitMaskImage: mask,
        };
        return <span key={blur} className="absolute inset-0" style={style} />;
      })}
      <span
        className="absolute inset-0"
        style={{ background: `linear-gradient(${inward}, ${wash})` }}
      />
    </div>
  );
}

function TopBar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <EdgeBlur edge="top" />
    </header>
  );
}

const TOP_LINKS: { overlay: Overlay; label: string }[] = [
  { overlay: "about", label: "About & Services" },
  { overlay: "contact", label: "Contact me" },
];

/** The two top buttons: About & Services and Contact me, each opening its
 * overlay. From the sm breakpoint up they sit in the top corners; on phones,
 * where they'd run into the name, they fold into the menu. */
function TopButtons({ onOpen }: { onOpen: (overlay: Overlay) => void }) {
  return (
    <>
      <button
        type="button"
        onClick={() => onOpen("about")}
        className={`${outlineButtonClasses} button-appear fixed top-4 left-4 z-50 max-sm:hidden`}
        style={appearAfter(0)}
      >
        About &amp; Services
      </button>
      <button
        type="button"
        onClick={() => onOpen("contact")}
        className={`${outlineButtonClasses} button-appear fixed top-4 right-4 z-50 max-sm:hidden`}
        style={appearAfter(1)}
      >
        Contact me
      </button>
      <TopMenu onOpen={onOpen} />
    </>
  );
}

/** Phones: a square menu button (top-right) whose panel drops below it with
 * the two top buttons' links. A tap outside, Escape or a pick closes it. */
function TopMenu({ onOpen }: { onOpen: (overlay: Overlay) => void }) {
  const [open, setOpen] = useState(false);
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="fixed top-4 right-4 z-50 sm:hidden">
      <button
        type="button"
        aria-label="Menu"
        aria-expanded={open}
        aria-controls="top-menu"
        onClick={() => setOpen((value) => !value)}
        className={`${outlineButtonClasses} button-appear w-10 px-0 aria-expanded:bg-[color-mix(in_srgb,var(--ds-background-100),var(--ds-gray-1000)_3%)]`}
        style={appearAfter(0)}
      >
        <img src="/icons/bars-two.svg" alt="" width={18} height={18} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            id="top-menu"
            // Grows from under the button, with the site's blur-in curve.
            className="absolute top-12 right-0 flex w-max origin-top-right flex-col rounded-[16px] border border-stroke bg-background-100 p-1"
            initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4, filter: "blur(4px)" }}
            animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: -4, filter: "blur(4px)" }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {TOP_LINKS.map(({ overlay, label }) => (
              <button
                key={overlay}
                type="button"
                onClick={() => {
                  setOpen(false);
                  onOpen(overlay);
                }}
                className="flex h-10 cursor-pointer items-center rounded-[12px] px-3 text-[15px] leading-[normal] font-medium tracking-[-0.15px] whitespace-nowrap text-gray-1000 transition-colors duration-150 hover:bg-[color-mix(in_srgb,var(--ds-background-100),var(--ds-gray-1000)_3%)] active:bg-[color-mix(in_srgb,var(--ds-background-100),var(--ds-gray-1000)_5%)]"
              >
                {label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

type Overlay = "about" | "contact";

// The contact overlay's strap is this much longer than on the home page.
const CONTACT_STRAP_SCALE = 1.15;

/**
 * A full-screen layer over the page: everything behind blurs under a veil of
 * the page color. Return Home (top-left, where About & Services is) or
 * Escape closes it; the page behind doesn't scroll while it's open.
 */
function OverlayShell({
  label,
  onClose,
  children,
}: {
  label: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      root.style.overflow = overflow;
    };
  }, [onClose]);

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={label}
      className="fixed inset-0 z-[60] overflow-y-auto bg-concept-background/90 backdrop-blur-[24px]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Above the content (the card's canvas comes later in the page). */}
      <button
        type="button"
        onClick={onClose}
        autoFocus
        aria-label="Return Home"
        className={`${outlineButtonClasses} button-appear fixed top-4 left-4 z-10`}
        style={appearAfter(0)}
      >
        <img src="/icons/arrow-redo-down-forward.svg" alt="" width={18} height={18} />
        {/* Just "Return" on phones, to leave room for the name. */}
        Return<span className="max-sm:hidden"> Home</span>
      </button>
      {children}
    </motion.div>
  );
}

/** About & Services: the profile photo (120px), the intro, then the services,
 * 48px apart in one column, centered in the viewport. The name stays visible
 * above this overlay; on short screens the column scrolls and starts 48px
 * below it (the name ends at 47px). */
function AboutContent() {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-[95px] text-center text-[15px] tracking-[-0.15px] text-gray-1000 [&_p]:leading-[normal]">
      <div className="flex w-[440px] max-w-full flex-col items-center gap-12">
        <ProfilePhoto size={120} />
        <IntroBlock />
        <ServicesBlock />
      </div>
    </div>
  );
}

/** Contact: the business card, hanging from the top on a slightly longer
 * strap, built straight away. */
function ContactContent() {
  return <Badge strapScale={CONTACT_STRAP_SCALE} immediate fullBleed={false} />;
}

/** The name, centered at the top, level with the buttons' middle (16px +
 * half their 40px, less half its own height: 22px, or 21px on phones).
 * `raised` puts it above an overlay (About), so it stays put and sharp.
 * `hidden` fades it out on phones while an overlay is open, where it would
 * run into the Return button. */
function Logo({ raised, hidden }: { raised: boolean; hidden: boolean }) {
  return (
    <Link
      href="/"
      aria-label="Ahmed A. Azouzi, home"
      className={`fixed top-[25.5px] left-1/2 -translate-x-1/2 transition-opacity duration-300 sm:top-[25px] ${raised ? "z-[70]" : "z-50"} ${hidden ? "max-sm:pointer-events-none max-sm:opacity-0" : ""}`}
    >
      <h1 className="sr-only">Ahmed A. Azouzi</h1>
      <NameLogo3D />
    </Link>
  );
}

function TabLogo({ project, logo, width }: { project: Project; logo?: string; width?: number }) {
  return (
    <img
      src={logo ?? project.logo}
      alt={project.alt}
      width={width ?? (project.width * LOGO_HEIGHT) / 20}
      height={LOGO_HEIGHT}
      className="relative block h-3.5 w-auto shrink-0 sm:h-4"
      style={
        !logo && project.mask
          ? {
              maskImage: `url("${project.mask}")`,
              maskSize: "100% 100%",
              maskRepeat: "no-repeat",
            }
          : undefined
      }
    />
  );
}

// Wheel and trackpad scrolling go this many times as far (use-scroll-boost).
const SCROLL_BOOST = 1.7;

// Within this many px of the page's end, the bar shows whichever way you scroll.
const END_MARGIN = 40;

// Scrolled this far (px) in one direction before the bar reacts.
const SCROLL_THRESHOLD = 6;

/** True while the page is being scrolled down (past the very top); false as
 * soon as it scrolls back up, or reaches the end of the page. */
function useHideOnScrollDown() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      const moved = y - last;
      if (Math.abs(moved) < SCROLL_THRESHOLD) return;
      // Back at the end of the page too, even while still scrolling down.
      const atEnd = y + window.innerHeight >= document.documentElement.scrollHeight - END_MARGIN;
      setHidden(moved > 0 && y > 40 && !atEnd);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return hidden;
}

function BottomBar({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (id: string) => void;
}) {
  const reduced = useReducedMotion();
  const hidden = useHideOnScrollDown();

  return (
    <footer className="fixed inset-x-0 bottom-0 z-50">
      <EdgeBlur edge="bottom" />
      {/* Slides away while scrolling down, and glides back on the way up:
          a quick ease-out in (the site's blur-in curve), a faster ease-in
          out. No overshoot. */}
      <motion.div
        className="relative flex justify-center px-3 pt-8 pb-5 sm:px-5 lg:pb-6"
        initial={false}
        animate={
          reduced
            ? { opacity: hidden ? 0 : 1 }
            : { y: hidden ? "110%" : "0%", scale: hidden ? 0.96 : 1, opacity: hidden ? 0 : 1 }
        }
        transition={
          reduced
            ? { duration: 0.2 }
            : hidden
              ? { duration: 0.22, ease: [0.4, 0, 1, 1] }
              : { duration: 0.35, ease: [0.22, 1, 0.36, 1] }
        }
        style={{ pointerEvents: hidden ? "none" : undefined }}
        inert={hidden}
      >
        <div
          role="tablist"
          aria-label="Projects"
          // Slightly see-through, with a light blur of the work behind it.
          className="button-appear flex h-12 w-full max-w-[456px] items-center rounded-[16px] bg-concept-track/70 px-1 backdrop-blur-[2px]"
          style={appearAfter(2)}
        >
          {TABS.map((tab) => {
            const project = getProject(tab.id)!;
            const active = tab.id === selected;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onSelect(tab.id)}
                className="relative flex h-[38px] flex-1 cursor-pointer items-center justify-center rounded-[12px] transition-opacity duration-150 hover:opacity-70 aria-selected:hover:opacity-100"
              >
                {/* The white tab slides from one project to the next. */}
                {active && (
                  <motion.span
                    layoutId="concept-tab"
                    transition={reduced ? { duration: 0 } : { type: "spring", bounce: 0.15, duration: 0.4 }}
                    className="absolute inset-0 rounded-[12px] bg-concept-background/70"
                  />
                )}
                <TabLogo project={project} logo={tab.logo} width={tab.width} />
              </button>
            );
          })}
        </div>
      </motion.div>
    </footer>
  );
}

/** `initial` comes from ?project=<id>; switching keeps the URL in step so a
 * view can be shared. */
/** `effect` picks the scroll effect for the media (effects.ts); Bend by
 * default. */
export function HomePage({
  initial = TABS[0].id,
  effect,
}: {
  initial?: string;
  effect?: string;
}) {
  const [selected, setSelected] = useState(initial);
  // Wheel and trackpad scrolling go a little further through the gallery.
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const closeOverlay = useCallback(() => setOverlay(null), []);
  // Off while an overlay is open: the page behind stays put.
  useScrollBoost(SCROLL_BOOST, overlay === null);
  const project = getProject(selected)!;

  function select(id: string) {
    if (id === selected) return;
    setSelected(id);
    window.history.replaceState(null, "", `?project=${id}`);
    // A new project starts at the top.
    window.scrollTo({ top: 0 });
  }

  return (
    <div data-concept className="min-h-svh bg-concept-background">
      <TopBar />
      <TopButtons onOpen={setOverlay} />
      <AnimatePresence>
        {overlay === "about" && (
          <OverlayShell key="about" label="About & Services" onClose={closeOverlay}>
            <AboutContent />
          </OverlayShell>
        )}
        {overlay === "contact" && (
          <OverlayShell key="contact" label="Contact" onClose={closeOverlay}>
            <ContactContent />
          </OverlayShell>
        )}
      </AnimatePresence>
      <Logo raised={overlay === "about"} hidden={overlay !== null} />
      {/* Clears the bars at either end: their height plus room to breathe. */}
      <main className="px-5 pt-[132px] pb-[168px] text-[15px] tracking-[-0.15px] text-gray-1000 [&_p]:leading-[normal]">
        {/* Keyed so the new project plays its blur-in from the start. */}
        <div key={project.id} className="flex flex-col items-center gap-20">
          {/* Misc. goes straight to the work, without its intro. */}
          <ProjectBody project={project} centered intro={project.id !== "misc"} />
        </div>
      </main>
      <MediaEffects effect={effect} />
      <BottomBar selected={selected} onSelect={select} />
    </div>
  );
}
