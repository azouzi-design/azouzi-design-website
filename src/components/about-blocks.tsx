import { CallToAction } from "@/components/call-to-action";
import { ProfilePhoto } from "@/components/profile-photo";
import { SoftBlurIn, SoftBlurItem } from "@/components/soft-blur-in";

// The home page's About & Services overlay: my photo, who I am and how I
// work (each one paragraph of phrases), then the call to action.

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

/** The About & Services column: the profile photo (120px), the intro, the
 * services and the call to action, 40px apart. They play as one sequence,
 * like a project's intro: each blurs in a beat after the one before (on
 * phones, the photo fades and rises and the text plays line by line). */
export function AboutBlocks() {
  return (
    <SoftBlurIn className="flex w-[440px] max-w-full flex-col items-center gap-10">
      <SoftBlurItem text={false}>
        <ProfilePhoto size={120} />
      </SoftBlurItem>
      <SoftBlurItem>
        <Phrases phrases={intro} />
      </SoftBlurItem>
      <SoftBlurItem>
        <Phrases phrases={services} />
      </SoftBlurItem>
      <SoftBlurItem>
        <CallToAction />
      </SoftBlurItem>
    </SoftBlurIn>
  );
}
