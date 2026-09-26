"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export type ProjectId = "cynoia" | "thunders" | "publicbrain" | "stint" | "misc";

type ProjectSelectionContextValue = {
  selected: ProjectId;
  select: (id: ProjectId) => void;
};

const ProjectSelectionContext =
  createContext<ProjectSelectionContextValue | null>(null);

export function ProjectSelectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [selected, setSelected] = useState<ProjectId>("cynoia");

  return (
    <ProjectSelectionContext.Provider value={{ selected, select: setSelected }}>
      {children}
    </ProjectSelectionContext.Provider>
  );
}

export function useProjectSelection() {
  const ctx = useContext(ProjectSelectionContext);
  if (!ctx) {
    throw new Error(
      "useProjectSelection must be used within a ProjectSelectionProvider"
    );
  }
  return ctx;
}
