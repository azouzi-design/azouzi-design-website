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
};

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
    paragraphs: ["Paragraph 1", "Paragraph 2"],
  },
  {
    id: "thunders",
    logo: "/images/logo-thunders.svg",
    alt: "Thunders",
    width: 100.417,
    mask: "/images/logo-thunders-mask.svg",
    // The lighter of the logo's two blues.
    brand: "#0047BB",
    paragraphs: ["Paragraph 1", "Paragraph 2"],
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

export function getProject(id: string) {
  return projects.find((project) => project.id === id);
}
