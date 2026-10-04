"use client";

import { ProjectBar } from "@/components/project-card";
import type { Project } from "@/lib/projects";
import { useAtPageEnd } from "@/lib/use-at-page-end";

/**
 * Project pages: once scrolled to the end, the project bar floats back in at
 * the bottom, as wide as the page content. Its gap to the white card's bottom
 * edge mirrors the header's gap to the top: 12px, or 20px above 980px.
 * Scrolling up takes it away again. Same blur-in as the home Scroll Top.
 */
export function ProjectEndBar({ project }: { project: Project }) {
  const atEnd = useAtPageEnd();

  return (
    <div
      inert={!atEnd}
      className={`fixed inset-x-0 bottom-6 z-50 flex justify-center px-6 transition-[opacity,translate,filter] duration-300 ease-out md:bottom-7 md:px-7 min-[61.3125rem]:bottom-9 ${
        atEnd
          ? "opacity-100"
          : "pointer-events-none translate-y-2 opacity-0 blur-[4px]"
      }`}
    >
      <div className="w-full max-w-[920px]">
        <ProjectBar project={project} />
      </div>
    </div>
  );
}
