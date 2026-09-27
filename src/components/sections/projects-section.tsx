"use client";

import { useProjectSelection, type ProjectId } from "@/lib/project-selection";
import { SectionShell } from "./section-shell";

const PROJECTS: {
  id: ProjectId;
  title: string;
  serif?: boolean;
}[] = [
  { id: "cynoia", title: "Cynoia" },
  { id: "thunders", title: "Thunders" },
  { id: "publicbrain", title: "PublicBrain (now Farlus)" },
  { id: "stint", title: "Stint" },
  { id: "misc", title: "Misc.", serif: true },
];

export function ProjectsSection() {
  const { selected, select } = useProjectSelection();

  return (
    <SectionShell id="projects">
      <div className="absolute left-6 top-6 flex flex-col items-start gap-1">
        {PROJECTS.map((project) => {
          const isActive = project.id === selected;
          return (
            <button
              key={project.id}
              type="button"
              onClick={() => select(project.id)}
              className={`cursor-pointer whitespace-nowrap text-left leading-none transition-colors ${
                project.serif
                  ? "font-[family-name:var(--font-dm-serif)] text-[36px] tracking-[-0.72px]"
                  : "text-[32px] font-semibold tracking-[-0.64px]"
              } ${isActive ? "text-gray-1000" : "text-gray-500"}`}
            >
              {project.title}
            </button>
          );
        })}
      </div>

      <div className="absolute inset-x-2 bottom-2 flex h-[447px] gap-2">
        <div className="h-full flex-[597] rounded-sm bg-[#ebebeb]" />
        <div className="h-full flex-[313] rounded-sm bg-[#ebebeb]" />
        <div className="h-full flex-[597] rounded-sm bg-[#ebebeb]" />
      </div>
    </SectionShell>
  );
}
