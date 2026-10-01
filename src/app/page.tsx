import Image from "next/image";
import Link from "next/link";
import { CallToAction } from "@/components/call-to-action";
import {
  SoftBlurIn,
  SoftBlurItem,
  SoftBlurView,
} from "@/components/soft-blur-in";
import { ProjectCardLink } from "@/components/project-card";
import { VhsImage } from "@/components/vhs-image";
import { projects } from "@/lib/projects";
import { linkClasses } from "@/lib/styles";

// A print lying on the page, lit from the top-left (same light as the badge):
// a crisp contact edge, then a short soft falloff down-right. The lifted
// corners are separate blurred shapes in the markup.
const photoShadow = [
  "0 0 0 0.5px rgba(0,0,0,0.05)",
  "0.5px 0.5px 0.5px rgba(0,0,0,0.10)",
  "1px 2px 2px rgba(0,0,0,0.06)",
  "2px 5px 6px -2px rgba(0,0,0,0.075)",
].join(", ");

// Page-load order (seconds): intro text, then the photo, then the project
// cards one by one.
const SEQUENCE = { photo: 1.0, cards: 1.25, cardStep: 0.12 };

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

export default function Home() {
  return (
    <div className="flex flex-col items-center gap-[120px] pb-[120px] sm:gap-0 sm:pb-0">
      {/* Hero. Where the project cards sit in a row (sm+) it fills the first
          viewport: decorator on top, cards 20px above the bottom edge, intro
          centered in between. Hero height = viewport - page top padding
          (12/16px) - main top padding (12px) - 20px bottom margin. */}
      <div className="flex w-full flex-col items-center gap-[120px] sm:min-h-[calc(100svh-44px)] sm:gap-12 md:min-h-[calc(100svh-48px)]">
        {/* Decorator name + photo */}
        <header className="relative w-full">
          <h1 className="sr-only">Ahmed A. Azouzi</h1>
          <img
            src="/images/decorator.svg"
            alt=""
            width={1376}
            height={129}
            className="block h-auto w-full opacity-80"
          />
          {/* Desktop: sits between the two "A" letters of the decorator.
              Mobile: 72px, 12px under the decorator, 4px from the right edge. */}
          <div className="absolute top-[calc(100%+12px)] right-1 flex size-[73.25px] items-center md:size-[81.384px] justify-center md:top-[-20px] md:right-auto md:left-[57.245%] md:-translate-x-1/2">
            <SoftBlurView delay={SEQUENCE.photo}>
              <div className="relative size-[72px] -rotate-1 md:size-20">
                {/* Bottom corners lift slightly off the page */}
                <span
                  aria-hidden
                  className="absolute bottom-0.5 left-0.5 -z-10 h-4 w-[45%] translate-y-[3px] -rotate-3 bg-black/[0.18] blur-[5px]"
                />
                <span
                  aria-hidden
                  className="absolute right-0.5 bottom-0.5 -z-10 h-4 w-[45%] translate-x-[2px] translate-y-[4px] rotate-3 bg-black/[0.22] blur-[5px]"
                />
                <div
                  className="relative size-full overflow-hidden rounded-[2px] bg-background-100"
                  style={{ boxShadow: photoShadow }}
                >
                  <div className="absolute top-0 left-[-3.96%] h-full w-[110.7%]">
                    <Image
                      src="/images/azouzi.jpg"
                      alt="Ahmed Azouzi"
                      fill
                      // The photo shows at ~89px; ask for a 2x-sharp copy so
                      // retina and phone screens stay crisp.
                      sizes="180px"
                      quality={90}
                      preload
                      className="object-cover"
                    />
                  </div>
                  {/* VHS tape effect, only while hovered */}
                  <VhsImage src="/images/azouzi.jpg" />
                  {/* Faint gloss of a printed photo */}
                  <span
                    aria-hidden
                    className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0)_45%)]"
                  />
                </div>
              </div>
            </SoftBlurView>
          </div>
        </header>

        {/* Intro — right edge aligned to the page center */}
        <div className="flex w-full justify-center sm:flex-1 sm:items-center">
          <section className="w-[320px] md:-translate-x-1/2">
            <SoftBlurIn className="flex flex-col gap-3">
              <Lines lines={["Senior Product Designer", "(+5 years designing for Startups)"]} />
              <SoftBlurItem>
                <p>
                  Design Partner for AI founders, focused on agentic and
                  vertical AI
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
                lines={["Prev. Computer Science graduate and junior", "full-stack developer"]}
              />
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
            </SoftBlurIn>
          </section>
        </div>

        {/* Projects */}
        <section className="-mx-1 flex w-[calc(100%+8px)] flex-col gap-1.5 sm:flex-row">
          {projects.map((project, i) => (
            <SoftBlurView
              key={project.id}
              id={`project-${project.id}`}
              delay={SEQUENCE.cards + i * SEQUENCE.cardStep}
              // Replays stagger left to right, but only while they sit in a row.
              replayDelay={i * SEQUENCE.cardStep}
              navOffset={i * SEQUENCE.cardStep}
              replayDelayMinWidth={640}
              skipOnNavigation
              className="min-w-0 shrink-0 sm:flex-1"
            >
              <ProjectCardLink project={project} />
            </SoftBlurView>
          ))}
        </section>
      </div>

      {/* Services — left edge aligned to the page center. Where the cards sit
          in a row, the space around the block grows so block + space cover at
          least 70% of the viewport (never less than 120px each side). */}
      <div className="flex w-full justify-center sm:min-h-[70svh] sm:items-center sm:py-[120px]">
        <section className="w-[320px] md:translate-x-1/2">
          <SoftBlurIn className="flex flex-col gap-3">
            {services.map((lines) => (
              <Lines key={lines[0]} lines={lines} />
            ))}
            <SoftBlurItem>
              <CallToAction />
            </SoftBlurItem>
          </SoftBlurIn>
        </section>
      </div>
    </div>
  );
}
