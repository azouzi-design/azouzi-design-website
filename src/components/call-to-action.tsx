import { CopyEmailLink } from "@/components/copy-email-link";
import { linkClasses } from "@/lib/styles";

export function CallToAction() {
  return (
    <div className="flex items-center gap-2">
      <p className="whitespace-nowrap">
        <a
          href="https://cal.com/azouzi-design/30min"
          target="_blank"
          rel="noopener noreferrer"
          className={linkClasses}
        >
          Book a call
        </a>{" "}
        or <CopyEmailLink email="hello@azouzi.design" />
      </p>
      <span className="whitespace-nowrap rounded-[2px] bg-gray-700 px-1 py-px text-[12px] font-medium tracking-[-0.06px] text-background-100">
        1/2 spots left
      </span>
    </div>
  );
}
