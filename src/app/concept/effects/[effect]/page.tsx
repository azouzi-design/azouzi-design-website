import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HomePage } from "@/components/home-page";
import { EFFECTS, getEffect } from "@/components/media-effects/effects";
import { getProject } from "@/lib/projects";

export function generateStaticParams() {
  return EFFECTS.map(({ id }) => ({ effect: id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/concept/effects/[effect]">): Promise<Metadata> {
  const effect = getEffect((await params).effect);
  return {
    title: effect ? `Concept, ${effect.name.toLowerCase()}` : "Concept",
    // A design exploration, not part of the site yet.
    robots: { index: false, follow: false },
  };
}

/** The concept page with one of the scroll effects on its media. */
export default async function ConceptEffect({
  params,
  searchParams,
}: PageProps<"/concept/effects/[effect]">) {
  const { effect } = await params;
  if (!getEffect(effect)) notFound();
  // ?project=<id> opens on that project (every project has a tab).
  const { project } = await searchParams;
  const initial = typeof project === "string" ? getProject(project)?.id : undefined;
  return <HomePage initial={initial} effect={effect} />;
}
