import type { MetadataRoute } from "next";

const SITE = "https://www.azouzi.design";

// The site is a single page: the home page, with every project on it.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE }];
}
