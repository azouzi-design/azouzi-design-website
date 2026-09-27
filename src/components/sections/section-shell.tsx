import type { ReactNode } from "react";
import type { SectionId } from "@/components/global-nav";

export function SectionShell({
  id,
  children,
}: {
  id: SectionId;
  children?: ReactNode;
}) {
  return (
    <section id={id} className="relative h-svh w-full snap-start">
      <div className="absolute inset-3 overflow-hidden rounded-xl bg-surface">
        {children}
      </div>
    </section>
  );
}
