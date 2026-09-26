import { CopyEmailLink } from "@/components/copy-email-link";
import { SectionShell } from "./section-shell";

const linkClasses = "text-teal-700 underline decoration-dotted underline-offset-2";

export function ServicesSection() {
  return (
    <SectionShell id="services">
      <h1 className="absolute left-6 top-6 text-[64px] font-semibold leading-[0.9] tracking-[-1.92px] text-gray-1000">
        The
        <br />
        Design
        <br />
        Partner
        <br />
        Program
      </h1>

      <div className="absolute bottom-16 left-1/2 flex w-[452px] flex-col gap-5">
        <p className="text-xl font-medium tracking-[-0.06px] text-gray-1000">
          I work exactly like a team member embedded inside your team
        </p>

        <p className="text-xl font-medium tracking-[-0.06px] text-gray-1000">
          Part-time engagement; max 2 clients at once
        </p>

        <p className="text-xl font-medium tracking-[-0.06px] text-gray-1000">
          Senior-level product design, end to end
        </p>

        <p className="text-xl font-medium tracking-[-0.06px] text-gray-1000">
          One stop shop for all your design needs
        </p>

        <p className="text-xl font-medium tracking-[-0.06px] text-gray-1000">
          Daily updates and open communication 5 days a week
        </p>

        <p className="text-xl font-medium tracking-[-0.06px] text-gray-1000">
          Pause / Cancel anytime
        </p>

        <p className="flex flex-wrap items-center gap-2 text-xl font-medium tracking-[-0.06px] text-gray-1000">
          <a
            href="https://cal.com/azouzi-design/30min"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClasses}
          >
            Book a call
          </a>
          <span>or</span>
          <CopyEmailLink email="hello@azouzi.design" />
          <span className="rounded-[4px] bg-teal-700 px-1 py-px text-sm font-medium tracking-[-0.07px] text-white">
            1/2 spots left
          </span>
        </p>
      </div>
    </SectionShell>
  );
}
