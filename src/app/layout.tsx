import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import {
  SEP,
  SITE_DESCRIPTION,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
  THEME_COLOR,
} from "@/lib/site";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: THEME_COLOR,
};

export const metadata: Metadata = {
  // The site's main address (azouzi.design redirects here); it's what the
  // preview image URLs and canonicals resolve against.
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s${SEP}${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "Ahmed A. Azouzi", url: SITE_URL }],
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    url: "/",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@azouzidesign",
    creator: "@azouzidesign",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  icons: {
    icon: [
      { url: "/favicon_io/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon_io/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/favicon_io/apple-touch-icon.png",
  },
  manifest: "/favicon_io/site.webmanifest",
};

// Structured data for the whole site: the person and the service they offer.
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#person`,
      name: "Ahmed A. Azouzi",
      url: SITE_URL,
      jobTitle: "Design Partner",
      email: "mailto:hello@azouzi.design",
      sameAs: [
        "https://x.com/azouzidesign",
        "https://linkedin.com/in/azouzi",
      ],
    },
    {
      "@type": "ProfessionalService",
      "@id": `${SITE_URL}/#service`,
      name: SITE_NAME,
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      founder: { "@id": `${SITE_URL}/#person` },
      image: `${SITE_URL}/opengraph-image.png`,
    },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} antialiased`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
          }}
        />
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
