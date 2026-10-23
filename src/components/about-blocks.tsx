import { CallToAction } from "@/components/call-to-action";
import { SoftBlurIn, SoftBlurItem } from "@/components/soft-blur-in";

// The two text blocks of the home page's About & Services overlay: who I am,
// and how I work, each one paragraph of phrases; then the call to action.

const intro = [
  "Senior Product Designer (+5 years designing for startups)",
  "Design Partner for AI Founders, focused on Agentic AI and Vertical AI",
  "Multidisciplinary problem solver (visual design, product, AI, engineering, user experience, business, marketing, systems thinking..)",
  "Prev. computer science graduate and junior full-stack developer",
];

const services = [
  "I work exactly like a team member, embedded inside your team",
  "Part-time engagement; max 2 clients",
  "Senior-level product design, end to end",
  "One stop shop for all your design needs",
  "Daily updates and open communication, 5 days a week",
  "Pause / Cancel anytime",
];

/** Phrases run together in one paragraph, separated by ⏣. The space before
 * the mark doesn't break, so a line never starts with one. */
function Phrases({ phrases }: { phrases: string[] }) {
  return <p>{phrases.join(" ⏣ ")}</p>;
}

/** The intro: role, focus, background. */
export function IntroBlock({ sound = false }: { sound?: boolean }) {
  return (
    <SoftBlurIn sound={sound}>
      <SoftBlurItem>
        <Phrases phrases={intro} />
      </SoftBlurItem>
    </SoftBlurIn>
  );
}

/** The services. */
export function ServicesBlock({ sound = false }: { sound?: boolean }) {
  return (
    <SoftBlurIn sound={sound}>
      <SoftBlurItem>
        <Phrases phrases={services} />
      </SoftBlurItem>
    </SoftBlurIn>
  );
}

/** The call to action: Book a Call or Copy Email, and the price badge. */
export function CallToActionBlock({ sound = false }: { sound?: boolean }) {
  return (
    <SoftBlurIn sound={sound}>
      <SoftBlurItem>
        <CallToAction />
      </SoftBlurItem>
    </SoftBlurIn>
  );
}
