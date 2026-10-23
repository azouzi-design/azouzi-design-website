import Image from "next/image";
import { VhsImage } from "@/components/vhs-image";

// A print lying on the page, lit from the top-left (same light as the badge):
// a crisp contact edge, then a short soft falloff down-right. The lifted
// corners are separate blurred shapes in the markup.
const photoShadow = [
  "0 0 0 0.5px rgba(0,0,0,0.05)",
  "0.5px 0.5px 0.5px rgba(0,0,0,0.10)",
  "1px 2px 2px rgba(0,0,0,0.06)",
  "2px 5px 6px -2px rgba(0,0,0,0.075)",
].join(", ");

/** The profile photo as a small, slightly tilted print (`size` px, 80 by
 * default). Hovering plays a VHS tape effect over it. */
export function ProfilePhoto({ size = 80 }: { size?: number }) {
  return (
    <div className="relative -rotate-1" style={{ width: size, height: size }}>
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
            // A 2x-sharp copy, so retina and phone screens stay crisp.
            sizes={`${size * 2}px`}
            quality={90}
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
  );
}
