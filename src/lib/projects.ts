export type ProjectImage = {
  src: string;
  /** Pixel size of the file: the block on the page takes its aspect ratio. */
  width: number;
  height: number;
  alt: string;
};

export type Project = {
  id: string;
  logo: string;
  alt: string;
  width: number;
  mask?: string;
  /** The logo's own color: the project page header uses it as its background. */
  brand: string;
  /** Placeholder copy until the case studies are written. */
  paragraphs: string[];
  /** What follows the paragraphs, top to bottom. Without any, two
   * placeholder blocks show. */
  sections?: ProjectSection[];
};

export type Kpi = { value: string; label: string };

/** A run of images (null: an empty placeholder block until the image exists),
 * or headline results like "Raised $9M". */
export type ProjectSection =
  | { images: (ProjectImage | null)[] }
  | { kpis: Kpi[] };

const PLACEHOLDERS: ProjectSection = { images: [null, null] };

// "\u00a0" (non-breaking space) keeps sequences like "0 → 1 → N" on one line.
export const projects: Project[] = [
  {
    id: "stint",
    logo: "/images/logo-stint.svg",
    alt: "Stint",
    width: 63.958,
    brand: "#262626",
    paragraphs: ["Paragraph 1", "Paragraph 2"],
  },
  {
    id: "cynoia",
    logo: "/images/logo-cynoia.svg",
    alt: "Cynoia",
    width: 66.154,
    brand: "#8D45BA",
    paragraphs: [
      "Cynoia is a B2B team-collaboration SaaS platform with a suite of apps, including: project management, chat, video calls, file management, calendars, and notes.",
      "I led all design operations across product, website, web app, mobile app, and social media over 1.5 years, helping turn close to $1M in funding into a successful product from 0\u00a0→\u00a01\u00a0→\u00a0N.",
    ],
    // Two images between each pair of KPIs, and two to close.
    sections: [
      PLACEHOLDERS,
      {
        kpis: [
          { value: "~ $1M Raised", label: "in seed funding" },
          {
            value: "Best SaaS Startup in Africa",
            label: "Awarded at AfricaArena Grand Summit 2024",
          },
        ],
      },
      PLACEHOLDERS,
      {
        kpis: [
          { value: "+6k Users", label: "Accumulated across +13 countries" },
          {
            value: "Onboarded clients",
            label: "from major brands like Jira, Trello, and Asana",
          },
        ],
      },
      PLACEHOLDERS,
    ],
  },
  {
    id: "thunders",
    logo: "/images/logo-thunders.svg",
    alt: "Thunders",
    width: 100.417,
    mask: "/images/logo-thunders-mask.svg",
    // The lighter of the logo's two blues.
    brand: "#0047BB",
    paragraphs: [
      "Thunders is a Paris-based AI-powered platform that automates software testing through autonomous agents. Founded by Karim Jouini and Jihed Othmani, the team behind Expensya (acquired for $120M+).",
      "I worked for close to 1 year as part of the founding team, designing the product and website from 0\u00a0→\u00a01.",
    ],
    sections: [
      {
        images: [
          {
            src: "/images/thunders-1.jpg",
            width: 2880,
            height: 1620,
            alt: "Thunders logo above a note: Design under NDA",
          },
        ],
      },
      {
        kpis: [
          {
            value: "Raised $9M",
            label:
              "in seed funding (one of the largest seed rounds in the testing space)",
          },
          {
            value: "Station F's Future 40 2025, top 4%",
            label:
              "selected out of 1,000+ startups on campus, just 10 months after founding",
          },
          {
            value: "Paying clients",
            label:
              "across the US, Canada, France, and Tunisia, in only a few months post-launch",
          },
        ],
      },
    ],
  },
  {
    id: "misc",
    logo: "/images/logo-misc.svg",
    alt: "Misc.",
    width: 58.115,
    brand: "#171717",
    paragraphs: ["Paragraph 1", "Paragraph 2"],
  },
];

export function getSections(project: Project): ProjectSection[] {
  return project.sections ?? [PLACEHOLDERS];
}

export function getProject(id: string) {
  return projects.find((project) => project.id === id);
}
