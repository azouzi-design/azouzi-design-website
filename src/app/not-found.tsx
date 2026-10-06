import type { Metadata } from "next";
import Link from "next/link";
import { pillClasses } from "@/lib/styles";

export const metadata: Metadata = {
  title: "404",
  robots: { index: false },
};

// Sits in the shared white card like every other page (no extra margin or
// background); the min-height fills the viewport inside the page padding
// (12/16px each side) and the card's top padding.
export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100svh-44px)] flex-col md:min-h-[calc(100svh-48px)]">
      <div className="flex">
        <Link href="/" className={pillClasses}>
          <img src="/icons/arrow-redo-down-forward.svg" alt="" width={18} height={18} />
          Return Home
        </Link>
      </div>
      <div className="flex flex-1 items-center justify-center">
        <h1 className="text-[15px] font-normal tracking-[-0.15px]">
          404 — page not found
        </h1>
      </div>
      <img
        src="/images/decorator.svg"
        alt=""
        width={1376}
        height={129}
        className="block h-auto w-full opacity-80"
      />
    </div>
  );
}
