import Link from "next/link";
import { CallToAction } from "@/components/call-to-action";
import { SoftBlurIn, SoftBlurItem } from "@/components/soft-blur-in";
import { linkClasses } from "@/lib/styles";

// The home page's two text blocks: who I am, and how I work. Also shown in
// the /concept page's About & Services overlay.

const services = [
  ["I work exactly like a team member", "embedded inside your team"],
  ["Part-time engagement; max 2 clients"],
  ["Senior-level product design, end to end"],
  ["One stop shop for all your design needs"],
  ["Daily updates and open communication", "5 days a week"],
  ["Pause / Cancel anytime"],
];

function Lines({ lines }: { lines: string[] }) {
  return (
    <SoftBlurItem>
      <p>
        {lines.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))}
      </p>
    </SoftBlurItem>
  );
}

/** The intro: role, focus, background, and (unless `short`) the Stint line
 * and the call to action. */
export function IntroBlock({ sound = false, short = false }: { sound?: boolean; short?: boolean }) {
  return (
    <SoftBlurIn className="flex flex-col gap-3" sound={sound}>
      <Lines lines={["Senior Product Designer", "(+5 years designing for startups)"]} />
      <SoftBlurItem>
        <p>
          Design Partner for AI Founders, focused on Agentic AI and
          Vertical AI
        </p>
      </SoftBlurItem>
      <SoftBlurItem>
        <p>
          Multidisciplinary problem solver (visual design, product, AI,
          engineering, user experience, business, marketing, systems
          thinking..)
        </p>
      </SoftBlurItem>
      <Lines
        lines={["Prev. computer science graduate and junior", "full-stack developer"]}
      />
      {!short && (
        <>
          <SoftBlurItem>
            <p>
              Loves building consumer products{" "}
              <Link href="/projects/stint" className={linkClasses}>
                @Stint
              </Link>
            </p>
          </SoftBlurItem>
          <SoftBlurItem>
            <CallToAction />
          </SoftBlurItem>
        </>
      )}
    </SoftBlurIn>
  );
}

/** The services list, and the call to action again. */
export function ServicesBlock({ sound = false }: { sound?: boolean }) {
  return (
    <SoftBlurIn className="flex flex-col gap-3" sound={sound}>
      {services.map((lines) => (
        <Lines key={lines[0]} lines={lines} />
      ))}
      <SoftBlurItem>
        <CallToAction />
      </SoftBlurItem>
    </SoftBlurIn>
  );
}
