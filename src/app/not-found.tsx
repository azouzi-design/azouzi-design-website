import type { Metadata } from "next";
import Link from "next/link";
import { outlineButtonClasses } from "@/lib/styles";

export const metadata: Metadata = {
  title: "404",
  robots: { index: false },
};

// Laid out against the viewport: Return Home 16px from the top-left, as in
// the home page's overlays, text centered, decorator 16px from the bottom,
// left and right.
export default function NotFound() {
  return (
    <div>
      <Link href="/" className={`${outlineButtonClasses} fixed top-4 left-4`}>
        <img src="/icons/arrow-redo-down-forward.svg" alt="" width={18} height={18} />
        Return Home
      </Link>
      <h1 className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[15px] font-normal tracking-[-0.15px] whitespace-nowrap">
        404 — page not found
      </h1>
      <img
        src="/images/decorator.svg"
        alt=""
        width={1376}
        height={129}
        className="pointer-events-none fixed inset-x-4 bottom-4 block h-auto w-[calc(100%-32px)] opacity-80"
      />
    </div>
  );
}
