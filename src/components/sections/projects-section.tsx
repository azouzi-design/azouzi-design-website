"use client";

import { useProjectSelection, type ProjectId } from "@/lib/project-selection";
import { SectionShell } from "./section-shell";

const PROJECTS: {
  id: ProjectId;
  title: string;
  top: string;
  left: string;
  serif?: boolean;
}[] = [
  { id: "cynoia", title: "Cynoia", top: "17.68%", left: "54.21%" },
  { id: "thunders", title: "Thunders", top: "31.88%", left: "26.64%" },
  {
    id: "publicbrain",
    title: "PublicBrain (now Farlus)",
    top: "55.65%",
    left: "10.57%",
  },
  { id: "stint", title: "Stint", top: "52.17%", left: "65.21%" },
  { id: "misc", title: "Misc.", top: "71.3%", left: "46.43%", serif: true },
];

export function ProjectsSection() {
  const { selected, select } = useProjectSelection();

  return (
    <SectionShell id="projects">
      <div className="absolute inset-x-0 top-0 bottom-[455px]">
        {PROJECTS.map((project) => {
          const isActive = project.id === selected;
          return (
            <button
              key={project.id}
              type="button"
              onClick={() => select(project.id)}
              className={`absolute whitespace-nowrap text-left transition-colors ${
                project.serif
                  ? "font-[family-name:var(--font-dm-serif)] text-[36px] tracking-[-0.72px]"
                  : "text-[32px] font-semibold tracking-[-0.64px]"
              } ${isActive ? "text-gray-1000" : "text-gray-500"}`}
              style={{ left: project.left, top: project.top }}
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
