import type { MetadataRoute } from "next";
import { projects } from "@/lib/projects";

const SITE = "https://www.azouzi.design";

// Every page of the site: the home page and each project.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE },
    ...projects.map((project) => ({ url: `${SITE}/projects/${project.id}` })),
  ];
}
