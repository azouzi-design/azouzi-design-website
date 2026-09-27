"use client";

import type { ReactNode } from "react";
import { useProjectSelection, type ProjectId } from "@/lib/project-selection";

export function SelectProjectLink({
  projectId,
  className,
  children,
}: {
  projectId: ProjectId;
  className?: string;
  children: ReactNode;
}) {
  const { select } = useProjectSelection();

  function handleClick() {
    select(projectId);
    document
      .getElementById("projects")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`cursor-pointer ${className ?? ""}`}
    >
      {children}
    </button>
  );
}
