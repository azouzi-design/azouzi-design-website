export type ProjectImage = {
  src: string;
  /** Pixel size of the file: the block on the page takes its aspect ratio. */
  width: number;
  height: number;
  alt: string;
  /** A silent looping clip (.mp4) rather than a still. */
  video?: boolean;
  /** Draw the stroke around it (for shots that blend into the page). */
  stroke?: boolean;
};

/**
 * A project's numbered shots from public/projects/<id>/, given as
 * [file, width, height]. Videos were converted to web .mp4 (1920px wide at
 * most, 60fps at most, no audio) from the originals. `stroked` lists the
 * shot numbers that get the stroke.
 */
function shots(
  id: string,
  alt: string,
  files: [string, number, number][],
  stroked: number[],
): ProjectImage[] {
  return files.map(([file, width, height]) => ({
    src: `/projects/${id}/${file}`,
    width,
    height,
    alt: `${alt} work, shot ${parseInt(file)}`,
    video: file.endsWith(".mp4"),
    stroke: stroked.includes(parseInt(file)),
  }));
}

const cynoiaShots = shots("cynoia", "Cynoia", [
  ["1.png", 3072, 1480],
  ["2.png", 3200, 1800],
  ["3.mp4", 1920, 1142],
  ["4.png", 3200, 1800],
  ["5.png", 3200, 1800],
  ["6.png", 3072, 1480],
  ["7.png", 3200, 1800],
  ["8.png", 3072, 1480],
  ["9.mp4", 1920, 1142],
  ["10.png", 3072, 1480],
  ["11.png", 3200, 1800],
  ["12.png", 3200, 1800],
  ["13.png", 3200, 1800],
], [2, 3, 5, 6, 8, 9, 11]);

export type Project = {
  id: string;
  logo: string;
  alt: string;
  width: number;
  mask?: string;
  /** The logo's own color: the project page header uses it as its background. */
  brand: string;
  /** The intro text under the project bar, one entry per paragraph. */
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
    paragraphs: [
      "Stint is a focus session manager I'm designing, building, and working toward launching. I've tried a lot of task managers, and none of them matched how I actually work, so I made one that does. I'm handling all of it myself: the design, the code, the product decisions, and eventually the launch.",
    ],
    sections: [
      {
        images: shots("stint", "Stint", [
          ["1.png", 3200, 1800],
          ["2.mp4", 1920, 1080],
          ["3.mp4", 1800, 1500],
          ["4.png", 3200, 1800],
          ["5.png", 3200, 2408],
          ["6.png", 1600, 1204],
          ["7.png", 3200, 1800],
          ["8.mp4", 1920, 1280],
          ["9.png", 3200, 1800],
          ["10.png", 2880, 1720],
          ["11.mp4", 1920, 1146],
          ["12.png", 3200, 1800],
          ["13.png", 3200, 1800],
          ["14.png", 3200, 1800],
        ], [3, 7, 10, 11, 14]),
      },
    ],
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
    // A pair of KPIs after every three shots, then the rest of the shots.
    sections: [
      { images: cynoiaShots.slice(0, 3) },
      {
        kpis: [
          { value: "~ $1M Raised", label: "in seed funding" },
          {
            value: "Best SaaS Startup in Africa",
            label: "Awarded at AfricaArena Grand Summit 2024",
          },
        ],
      },
      { images: cynoiaShots.slice(3, 6) },
      {
        kpis: [
          { value: "+6k Users", label: "Accumulated across +13 countries" },
          {
            value: "Onboarded clients",
            label: "from major brands like Jira, Trello, and Asana",
          },
        ],
      },
      { images: cynoiaShots.slice(6) },
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
    paragraphs: [
      "Bits and pieces from projects I've worked on over the past few years. Not everything gets a full case study, so I put the pieces I still like here, mostly client work for early-stage startups.",
    ],
    sections: [
      {
        images: shots("misc", "Misc.", [
          ["1.mp4", 1920, 1188],
          ["2.png", 3200, 1800],
          ["3.mp4", 1920, 1144],
          ["4.mp4", 1920, 1138],
          ["5.mp4", 1920, 1140],
          ["6.png", 3200, 1800],
          ["7.png", 3200, 1800],
          ["9.png", 3200, 1615],
          ["13-v2.png", 3200, 1800],
          ["10.mp4", 1920, 1186],
          ["11.mp4", 1920, 1186],
          ["12.mp4", 1920, 1186],
          ["14.mp4", 1920, 1142],
        ], [1, 13]),
      },
    ],
  },
];

export function getSections(project: Project): ProjectSection[] {
  return project.sections ?? [PLACEHOLDERS];
}

export function getProject(id: string) {
  return projects.find((project) => project.id === id);
}
