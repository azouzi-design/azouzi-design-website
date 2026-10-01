import Image from "next/image";
import { Badge } from "@/components/badge/badge";
import { CallToAction } from "@/components/call-to-action";
import {
  SoftBlurIn,
  SoftBlurItem,
  SoftBlurView,
} from "@/components/soft-blur-in";
import { linkClasses } from "@/lib/styles";

const projects = [
  { id: "stint", logo: "/images/logo-stint.svg", alt: "Stint", width: 63.958 },
  { id: "cynoia", logo: "/images/logo-cynoia.svg", alt: "Cynoia", width: 66.154 },
  {
    id: "thunders",
    logo: "/images/logo-thunders.svg",
    alt: "Thunders",
    width: 100.417,
    mask: "/images/logo-thunders-mask.svg",
  },
  { id: "misc", logo: "/images/logo-misc.svg", alt: "Misc.", width: 58.115 },
];

// A print lying on the page, lit from the top-left (same light as the badge):
// a crisp contact edge, then a short soft falloff down-right. The lifted
// corners are separate blurred shapes in the markup.
const photoShadow = [
  "0 0 0 0.5px rgba(0,0,0,0.05)",
  "0.5px 0.5px 0.5px rgba(0,0,0,0.10)",
  "1px 2px 2px rgba(0,0,0,0.06)",
  "2px 5px 6px -2px rgba(0,0,0,0.075)",
].join(", ");

// Page-load order (seconds): intro text, then the project cards one by one,
// then the photo last.
const SEQUENCE = { cards: 0.8, cardStep: 0.18, photo: 1.9 };

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
    <div className="min-h-svh px-3 pt-3 md:px-4 md:pt-4">
      <main className="relative flex w-full flex-col items-center gap-[120px] overflow-clip rounded-[24px] bg-background-100 px-3 pt-3 pb-[120px] text-[14px] tracking-[-0.14px] text-gray-1000 [&_p]:leading-[normal]">
        {/* Decorator name + photo */}
        <header className="relative w-full">
          <h1 className="sr-only">Ahmed A. Azouzi</h1>
          <img
            src="/images/decorator.svg"
            alt=""
            width={1376}
            height={129}
            className="block h-auto w-full"
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
                      sizes="89px"
                      preload
                      className="object-cover"
                    />
                  </div>
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
        <section className="w-[296px] md:-translate-x-1/2">
          <SoftBlurIn className="flex flex-col gap-3">
            <Lines lines={["Senior Product Designer", "(+5 years designing for Startups)"]} />
            <SoftBlurItem>
              <p>
                Design Partner for AI Founders (interested in working around
                agentic AI and vertical AI)
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
                <a href="#project-stint" className={linkClasses}>
                  @Stint
                </a>
              </p>
            </SoftBlurItem>
            <SoftBlurItem>
              <CallToAction />
            </SoftBlurItem>
          </SoftBlurIn>
        </section>

        {/* Projects */}
        <section className="-mx-1 flex w-[calc(100%+8px)] flex-col gap-1.5 sm:flex-row">
          {projects.map((project, i) => (
            <SoftBlurView
              key={project.id}
              id={`project-${project.id}`}
              delay={SEQUENCE.cards + i * SEQUENCE.cardStep}
              // Replays stagger left to right, but only while they sit in a row.
              replayDelay={i * SEQUENCE.cardStep}
              replayDelayMinWidth={640}
              className="flex h-[180px] min-w-0 shrink-0 items-center sm:h-[200px] sm:flex-1 justify-center overflow-clip rounded-[24px] bg-background-200 p-5"
            >
              <img
                src={project.logo}
                alt={project.alt}
                width={project.width}
                height={20}
                className="block h-5 shrink-0"
                style={
                  project.mask
                    ? {
                        maskImage: `url("${project.mask}")`,
                        maskSize: "100% 100%",
                        maskRepeat: "no-repeat",
                      }
                    : undefined
                }
              />
            </SoftBlurView>
          ))}
        </section>

        {/* Services — left edge aligned to the page center */}
        <section className="w-[296px] md:translate-x-1/2">
          <SoftBlurIn className="flex flex-col gap-3">
            {services.map((lines) => (
              <Lines key={lines[0]} lines={lines} />
            ))}
            <SoftBlurItem>
              <CallToAction />
            </SoftBlurItem>
          </SoftBlurIn>
        </section>
      </main>

      {/* Hanging badge below the card */}
      <Badge />
    </div>
  );
}
