import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";

// Same page as the home page, opened on the About & Services overlay (which
// follows the URL), so the address can be shared.
const description =
  "About Ahmed A. Azouzi and the design services he offers AI B2B SaaS founders.";

export const metadata: Metadata = {
  title: "About & Services",
  description,
  alternates: { canonical: "/about" },
  openGraph: { url: "/about", title: "About & Services", description },
};

export default function About() {
  return <HomePage />;
}
