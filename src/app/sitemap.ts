import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

// The site is a single page: the home page with every project on it, plus
// the About and Contact overlays, which have their own addresses.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL }, { url: `${SITE_URL}/about` }, { url: `${SITE_URL}/contact` }];
}
