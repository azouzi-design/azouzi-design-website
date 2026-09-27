import Image from "next/image";
import { SectionShell } from "./section-shell";

const linkClasses = "underline decoration-dotted underline-offset-2";

function ContactRow({
  label,
  value,
  href,
  badge,
}: {
  label: string;
  value: string;
  href: string;
  badge?: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex w-full items-start justify-between rounded-xl px-2 py-1 transition-colors duration-150 hover:bg-[#f8f8f8]"
    >
      <span className="flex flex-1 items-center gap-2 font-medium">
        {label}
        {badge && (
          <span className="rounded-[2px] bg-teal-700 px-1 py-px text-[13px] font-medium tracking-[-0.07px] text-white">
            {badge}
          </span>
        )}
      </span>
      <span className={`${linkClasses} flex-1 text-right`}>{value}</span>
    </a>
  );
}

export function ContactSection() {
  return (
    <SectionShell id="contact">
      <div className="absolute left-1/2 top-1/2 flex w-[720px] -translate-x-1/2 -translate-y-1/2 flex-col gap-8 text-[16px] tracking-[-0.2px] text-gray-1000">
        <div className="flex flex-col">
          <ContactRow
            label="Book a call"
            value="cal.com/azouzi-design/30min"
            href="https://cal.com/azouzi-design/30min"
          />
          <ContactRow
            label="Email"
            value="hello@azouzi.design"
            href="mailto:hello@azouzi.design"
          />
          <ContactRow
            label="Whatsapp"
            value="(+216) 58 289 199"
            href="https://wa.me/21658289199"
          />
        </div>

        <div className="flex flex-col">
          <ContactRow
            label="X"
            value="x.com/azouzidesign"
            href="https://x.com/azouzidesign"
            badge="Active Daily"
          />
          <ContactRow
            label="Linkedin"
            value="linkedin.com/in/azouzi"
            href="https://linkedin.com/in/azouzi"
          />
        </div>
      </div>

      <div className="absolute bottom-3 left-[calc(50%-352px)] h-12 w-4 overflow-hidden">
        <Image
          src="/images/figure.png"
          alt=""
          fill
          sizes="16px"
          className="object-cover"
        />
      </div>
    </SectionShell>
  );
}
