import type { Metadata } from "next";
import { HomePage } from "@/components/home-page";

// Same page as the home page, opened on the Contact overlay (which follows
// the URL), so the address can be shared.
const description = "Get in touch with Ahmed A. Azouzi, Design Partner for AI founders.";

export const metadata: Metadata = {
  title: "Contact",
  description,
  alternates: { canonical: "/contact" },
  openGraph: { url: "/contact", title: "Contact", description },
};

export default function Contact() {
  return <HomePage />;
}
