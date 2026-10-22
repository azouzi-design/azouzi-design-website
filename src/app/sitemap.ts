import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// The site is a single page: the home page, with every project on it.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL }];
}
