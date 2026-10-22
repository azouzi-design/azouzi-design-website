import type { Metadata } from "next";
import { LogoLab } from "@/components/name-logo-3d/logo-lab";

// A design exploration, not part of the site yet: kept out of search results.
export const metadata: Metadata = {
  title: "Logo directions",
  robots: { index: false, follow: false },
};

export default function LogoDirections() {
  return <LogoLab />;
}
