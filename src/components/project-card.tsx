import { ViewTransition } from "react";
import Link from "next/link";
import type { Project } from "@/lib/projects";

/**
 * The card on the home page and the header of its project page share a name,
 * so the browser morphs one into the other across the navigation. `open` is
 * the side being shown: true on the project page. The animation itself lives
 * in globals.css ("Project transitions").
 */
function CardTransition({
  project,
  open,
  children,
}: {
  project: Project;
  open: boolean;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* The project's color, for its transition pseudo-elements. */}
      <style href={`project-brand-${project.id}`} precedence="default">
        {`::view-transition-image-pair(.brand-${project.id}){--brand:${project.brand}}`}
      </style>
      <ViewTransition
        name={`project-card-${project.id}`}
        share={`card-morph ${open ? "card-open" : "card-close"} brand-${project.id}`}
        default="none"
      >
        {children}
      </ViewTransition>
    </>
  );
}

function Logo({ project, white }: { project: Project; white?: boolean }) {
  return (
    <ViewTransition
      name={`project-logo-${project.id}`}
      share="logo-morph"
      default="none"
    >
      <img
        src={project.logo}
        alt={project.alt}
        width={project.width}
        height={20}
        className={`block h-5 shrink-0 ${white ? "brightness-0 invert" : ""}`}
        style={
          project.mask
            ? {
                maskImage: `url("${project.mask}")`,
                maskSize: "100% 100%",
                maskRepeat: "no-repeat",
              }
            : undefined
        }
      />
    </ViewTransition>
  );
}

const cardBase =
  "flex w-full items-center justify-center overflow-clip rounded-[24px] px-5";
const cardClasses = `${cardBase} h-[180px] bg-background-200 py-5 sm:h-[200px]`;
// The project page header is shorter than the home card.
const headerClasses = `${cardBase} h-12`;

// Hover: the card darkens a touch. Press: it sinks in.
const interactiveClasses =
  "cursor-pointer transition-[background-color,scale] duration-200 ease-out hover:bg-(--card-hover) active:scale-[0.985] active:duration-100";

/** Home page card: opens the project. */
export function ProjectCardLink({ project }: { project: Project }) {
  return (
    <CardTransition project={project} open={false}>
      <Link
        href={`/projects/${project.id}`}
        aria-label={project.alt}
        className={`${cardClasses} ${interactiveClasses}`}
      >
        <Logo project={project} />
      </Link>
    </CardTransition>
  );
}

/** Project page header: the same card, now at the top. Goes back home. */
export function ProjectCardHeader({ project }: { project: Project }) {
  return (
    <CardTransition project={project} open>
      <Link
        href="/"
        aria-label={`${project.alt}, back to home`}
        className={`${headerClasses} cursor-pointer`}
        style={{ backgroundColor: project.brand }}
      >
        <Logo project={project} white />
      </Link>
    </CardTransition>
  );
}
