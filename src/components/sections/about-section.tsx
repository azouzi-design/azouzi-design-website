import Image from "next/image";
import { CopyEmailLink } from "@/components/copy-email-link";
import { SelectProjectLink } from "@/components/select-project-link";
import { SectionShell } from "./section-shell";

const linkClasses = "text-teal-700 underline decoration-dotted underline-offset-2";

export function AboutSection() {
  return (
    <SectionShell id="about">
      <div className="absolute left-6 top-6 h-[103px] w-[276px]">
        <h1 className="[text-box-edge:cap_alphabetic] [text-box-trim:trim-both] whitespace-nowrap text-[64px] font-semibold leading-[0] tracking-[-1.92px] text-gray-1000">
          <span className="block leading-[0.9]">Ahmed A.</span>
          <span className="block leading-[0.9]">Azouzi</span>
        </h1>
        <div className="absolute left-[203px] top-[44px] flex size-[168px] items-center justify-center">
          <div className="relative size-40 -rotate-3 overflow-hidden rounded-sm shadow-[4px_6px_20px_2px_rgba(0,0,0,0.05),2px_3px_8px_1px_rgba(0,0,0,0.12)]">
            <Image
              src="/images/profile.jpeg"
              alt="Ahmed Azouzi"
              fill
              sizes="160px"
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>

      <div className="absolute bottom-16 left-1/2 flex w-[452px] flex-col gap-5">
        <p className="text-xl font-medium tracking-[-0.2px] text-gray-1000">
          Senior Product Designer
          <br />
          (+5 years designing for Startups)
        </p>

        <p className="text-xl font-medium tracking-[-0.2px] text-gray-1000">
          Design Partner for AI Founders (interested in working around
          agentic workflows and AI tools)
        </p>

        <p className="text-xl font-medium tracking-[-0.2px] text-gray-1000">
          Multidisciplinary problem solver (visual design, product,
          engineering, user experience, business, marketing, systems
          thinking..)
        </p>

        <p className="text-xl font-medium tracking-[-0.2px] text-gray-1000">
          Prev. Computer Science graduate and junior
          <br />
          full-stack developer
        </p>

        <p className="text-xl font-medium tracking-[-0.2px] text-gray-1000">
          Loves building consumer products{" "}
          <SelectProjectLink projectId="stint" className={linkClasses}>
            @Stint
          </SelectProjectLink>
        </p>

        <p className="flex flex-wrap items-center gap-2 text-xl font-medium tracking-[-0.2px] text-gray-1000">
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
          <span className="rounded-sm bg-teal-700 px-1 py-px text-sm font-medium tracking-[-0.07px] text-white">
            1/2 spots left
          </span>
        </p>
      </div>
    </SectionShell>
  );
}
