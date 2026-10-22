import { HomePage } from "@/components/home-page";
import { getProject } from "@/lib/projects";

/** The home page: the project gallery (see HomePage). */
export default async function Home({ searchParams }: PageProps<"/">) {
  // ?project=<id> opens on that project (every project has a tab).
  const { project } = await searchParams;
  const initial = typeof project === "string" ? getProject(project)?.id : undefined;
  return <HomePage initial={initial} />;
}
