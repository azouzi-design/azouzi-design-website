"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/badge/badge";
import { ProjectEndBar } from "@/components/project-end-bar";
import { ScrollToTop } from "@/components/scroll-to-top";
import { getProject } from "@/lib/projects";
import { markAppHydrated, markNavigation } from "@/components/soft-blur-in";

/**
 * The page frame, shared by every route so the white card persists while
 * navigating: only its content swaps, which is what lets a project card travel
 * to the top of its page instead of the page reloading.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const project = pathname.startsWith("/projects/")
    ? getProject(pathname.split("/")[2])
    : undefined;
  useEffect(markAppHydrated, []);

  // Every route change after the first render is a client-side navigation.
  const previousPath = useRef(pathname);
  useEffect(() => {
    if (pathname !== previousPath.current) markNavigation();
    previousPath.current = pathname;
  }, [pathname]);

  return (
    // The badge hangs below the card on the home page; elsewhere the card gets
    // the same margin at the bottom as at the top.
    <div
      className={`min-h-svh px-3 pt-3 md:px-4 md:pt-4 ${isHome ? "" : "pb-3 md:pb-4"}`}
    >
      <main className="main-reveal relative isolate w-full overflow-clip rounded-(--card-radius) bg-background-100 px-3 pt-3 text-[15px] tracking-[-0.15px] text-gray-1000 [&_p]:leading-[normal]">
        {/* Vertical grid lines (home page only), tied to the text columns: the intro's left edge,
            the shared center, and the services' right edge, plus one more column
            each side. Hidden on mobile, where the text blocks stack in one
            column. Bottom of the stack (-z-10 inside the isolated main). */}
        {isHome && (
        <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 -z-10 hidden w-full md:block">
          <span className="absolute inset-y-0 left-[calc(25%-160px)] w-px bg-gray-1000/[0.032]" />
          <span className="absolute inset-y-0 left-[calc(50%-326px)] w-px bg-gray-1000/[0.032]" />
          <span className="absolute inset-y-0 left-[calc(50%-6px)] w-px bg-gray-1000/[0.032]" />
          <span className="absolute inset-y-0 left-[calc(50%+320px)] w-px bg-gray-1000/[0.032]" />
          <span className="absolute inset-y-0 left-[calc(75%+160px)] w-px bg-gray-1000/[0.032]" />
        </div>
        )}
        {children}
      </main>

      {/* Hanging badge below the card, home page only */}
      {isHome && <Badge />}
      {isHome && <ScrollToTop />}
      {/* Keyed so it starts hidden again on each project */}
      {project && <ProjectEndBar key={project.id} project={project} />}
    </div>
  );
}
