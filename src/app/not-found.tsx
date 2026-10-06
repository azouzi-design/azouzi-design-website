import type { Metadata } from "next";
import Link from "next/link";
import { pillClasses } from "@/lib/styles";

export const metadata: Metadata = {
  title: "404",
  robots: { index: false },
};

// The 404 drops the white card: the whole screen is the page grey, with the
// decorator name along the bottom as on the home page. The negative margins
// cancel the card's padding, the min-height fills the viewport inside the
// page padding (12/16px each side).
export default function NotFound() {
  return (
    <div className="-mx-3 -mt-3 flex min-h-[calc(100svh-24px)] flex-col bg-background-200 p-3 md:min-h-[calc(100svh-32px)]">
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
