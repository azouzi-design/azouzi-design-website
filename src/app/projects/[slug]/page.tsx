import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectCardHeader } from "@/components/project-card";
import {
  STAGGER,
  SoftBlurIn,
  SoftBlurItem,
  SoftBlurView,
  TEXT_DELAY,
} from "@/components/soft-blur-in";
import { getProject, projects } from "@/lib/projects";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const project = getProject((await params).slug);
  return { title: project ? `${project.alt} — Ahmed Azouzi` : undefined };
}

// Two image blocks until the real case-study images exist.
const imageBlocks = [0, 1];

export default async function ProjectPage({ params }: Props) {
  const project = getProject((await params).slug);
  if (!project) notFound();

  return (
    <div className="flex flex-col items-center gap-20 pt-2 pb-[120px]">
      {/* The home page card, moved to the top */}
      <div className="w-full max-w-[920px]">
        <ProjectCardHeader project={project} />
      </div>

      {/* Same horizontal position as the intro block on the home page */}
      <section className="w-[320px] md:-translate-x-1/2">
        <SoftBlurIn className="flex flex-col gap-3">
          {project.paragraphs.map((paragraph) => (
            <SoftBlurItem key={paragraph}>
              <p>{paragraph}</p>
            </SoftBlurItem>
          ))}
        </SoftBlurIn>
      </section>

      <div className="flex w-full max-w-[920px] flex-col gap-10">
        {imageBlocks.map((i) => {
          // Same timing as the home text blocks: wait TEXT_DELAY, then play
          // in order, so the images follow on from the paragraphs.
          const delay = TEXT_DELAY + (project.paragraphs.length + i) * STAGGER;
          return (
            <SoftBlurView
              key={i}
              delay={delay}
              replayDelay={delay}
              navOffset={(project.paragraphs.length + i) * STAGGER}
              className="h-[300px] w-full rounded-[24px] bg-background-200 sm:h-[524px]"
            >
              <span className="sr-only">{`${project.alt} image ${i + 1}`}</span>
            </SoftBlurView>
          );
        })}
      </div>
    </div>
  );
}
