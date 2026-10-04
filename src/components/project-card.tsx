import { ViewTransition } from "react";
import Link from "next/link";
import { projects, type Project } from "@/lib/projects";
import { pillClasses } from "@/lib/styles";

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
    <ViewTransition
      name={`project-card-${project.id}`}
      share={`card-morph ${open ? "card-open" : "card-close morph-close"}`}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}

function Logo({ project, open }: { project: Project; open: boolean }) {
  return (
    <ViewTransition
      name={`project-logo-${project.id}`}
      share={`logo-morph ${open ? "" : "morph-close"}`}
      default="none"
    >
      <img
        src={project.logo}
        alt={project.alt}
        width={project.width}
        height={20}
        className="block h-5 shrink-0"
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
// The project page header is shorter than the home card, with the logo
// centered between its two buttons.
const headerClasses =
  "grid h-12 w-full grid-cols-[1fr_auto_1fr] items-center overflow-clip rounded-[24px] bg-background-200 px-1";
// The buttons arrive once the card has settled and blur out as it leaves
// (see "header-actions" in globals.css). Below sm their labels shorten to one word.
const actionClasses = `${pillClasses} header-actions`;

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
        <Logo project={project} open={false} />
      </Link>
    </CardTransition>
  );
}

/** Project page header: the same card, now at the top, with a way home and
 * on to the next project. */
export function ProjectCardHeader({ project }: { project: Project }) {
  const index = projects.findIndex(({ id }) => id === project.id);
  const next = projects[(index + 1) % projects.length];

  return (
    <CardTransition project={project} open>
      <div className={headerClasses}>
        <Link
          href="/"
          aria-label="Return home"
          className={`${actionClasses} justify-self-start`}
          style={{ viewTransitionName: "header-home" }}
        >
          <img src="/icons/arrow-redo-down-forward.svg" alt="" width={18} height={18} />
          <span className="max-sm:hidden">Return Home</span>
          <span className="sm:hidden">Home</span>
        </Link>
        <Logo project={project} open />
        <Link
          href={`/projects/${next.id}`}
          aria-label={`Next project: ${next.alt}`}
          className={`${actionClasses} justify-self-end`}
          style={{ viewTransitionName: "header-next" }}
        >
          <span className="max-sm:hidden">Next / {next.alt}</span>
          <span className="sm:hidden">Next</span>
          <img src="/icons/arrow-right.svg" alt="" width={18} height={18} />
        </Link>
      </div>
    </CardTransition>
  );
}
