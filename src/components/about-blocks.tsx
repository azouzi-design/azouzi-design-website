import Link from "next/link";
import { CallToAction } from "@/components/call-to-action";
import { SoftBlurIn, SoftBlurItem } from "@/components/soft-blur-in";
import { linkClasses } from "@/lib/styles";

// The two text blocks of the home page's About & Services overlay: who I am,
// and how I work.

const services = [
  ["I work exactly like a team member", "embedded inside your team"],
  ["Part-time engagement; max 2 clients"],
  ["Senior-level product design, end to end"],
  ["One stop shop for all your design needs"],
  ["Daily updates and open communication", "5 days a week"],
  ["Pause / Cancel anytime"],
];

/** A paragraph set on fixed lines, or (`flow`) as one sentence that wraps
 * to its column. */
function Lines({ lines, flow = false }: { lines: string[]; flow?: boolean }) {
  return (
    <SoftBlurItem>
      <p>
        {flow
          ? lines.join(" ")
          : lines.map((line, i) => (
              <span key={i} className="block">
                {line}
              </span>
            ))}
      </p>
    </SoftBlurItem>
  );
}

/** The intro: role, focus, background, and (unless `short`) the Stint line
 * and the call to action. `flow` drops the fixed line breaks. */
export function IntroBlock({
  sound = false,
  short = false,
  flow = false,
}: {
  sound?: boolean;
  short?: boolean;
  flow?: boolean;
}) {
  return (
    <SoftBlurIn className="flex flex-col gap-3" sound={sound}>
      <Lines lines={["Senior Product Designer", "(+5 years designing for startups)"]} flow={flow} />
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
        flow={flow}
      />
      {!short && (
        <>
          <SoftBlurItem>
            <p>
              Loves building consumer products{" "}
              <Link href="/?project=stint" className={linkClasses}>
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

/** The services list, and the call to action again. `flow` drops the fixed
 * line breaks. */
export function ServicesBlock({ sound = false, flow = false }: { sound?: boolean; flow?: boolean }) {
  return (
    <SoftBlurIn className="flex flex-col gap-3" sound={sound}>
      {services.map((lines) => (
        <Lines key={lines[0]} lines={lines} flow={flow} />
      ))}
      <SoftBlurItem>
        <CallToAction />
      </SoftBlurItem>
    </SoftBlurIn>
  );
}
