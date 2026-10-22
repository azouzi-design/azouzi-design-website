import Image from "next/image";
import { ProjectVideo } from "@/components/project-video";
import {
  STAGGER,
  SoftBlurIn,
  SoftBlurItem,
  SoftBlurView,
} from "@/components/soft-blur-in";
import {
  getSections,
  type Kpi,
  type Project,
  type ProjectImage,
} from "@/lib/projects";

// Seconds between the text and the first image starting: the same gap as the
// home page's text and photo (SEQUENCE.photo), so the image arrives once the
// paragraphs have mostly settled.
const IMAGE_DELAY = 1.0;
// Seconds between KPIs playing in turn: the same step as the home page's
// project cards (SEQUENCE.cardStep).
const KPI_STEP = 0.12;

/**
 * A run of images, full column width. `first` is the run right under the
 * paragraphs: it waits IMAGE_DELAY after them (the paragraphs all start
 * together, since each SoftBlurItem's own delay wins over its parent's),
 * whether arriving, loading or scrolling back up. Every other image plays as
 * soon as it scrolls into view.
 */
function ImageRun({
  project,
  images,
  first,
  numberFrom,
}: {
  project: Project;
  images: (ProjectImage | null)[];
  first: boolean;
  /** Placeholder numbering for screen readers, counted across the page. */
  numberFrom: number;
}) {
  return (
    <div className="flex w-full max-w-[920px] flex-col gap-5 sm:gap-10">
      {images.map((image, i) => {
        const offset = (first ? IMAGE_DELAY : 0) + i * STAGGER;
        return (
          <SoftBlurView
            key={i}
            delay={offset}
            replayDelay={first && i === 0 ? offset : 0}
            navOffset={offset}
            // Once shown, it stays: scrolling past doesn't hide it again.
            once
            // An image sets its own height; a placeholder keeps a fixed one.
            // The stroke is an overlay, so it never changes the media's size.
            // Stroked shots also get a very slight shadow.
            className={`relative w-full overflow-clip rounded-(--media-radius) ${image ? "" : "h-[300px] bg-background-200 sm:h-[524px]"} ${image?.stroke ? "shadow-[0_1px_4px_rgba(23,23,23,0.03)] after:pointer-events-none after:absolute after:inset-0 after:rounded-[inherit] after:border after:border-stroke" : ""}`}
            style={image?.radius ? { borderRadius: image.radius } : undefined}
          >
            {image?.video ? (
              <ProjectVideo video={image} />
            ) : image ? (
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                // Full width of the 920px column, less on smaller screens.
                sizes="(min-width: 944px) 920px, 100vw"
                quality={90}
                // The first image loads with the page, so it is ready when
                // its blur-in starts instead of popping in after it.
                preload={first && i === 0}
                className="block h-auto w-full"
              />
            ) : (
              <span className="sr-only">{`${project.alt} image ${numberFrom + i}`}</span>
            )}
          </SoftBlurView>
        );
      })}
    </div>
  );
}

/** KPIs — left edge on the page center, like the services block on the home
 * page. They play one after the other, like the home page's project cards,
 * when scrolled to: never as part of the page's opening sequence, so KPIs
 * near the top (Thunders) don't wait for it. */
function KpiBlock({ kpis, centered }: { kpis: Kpi[]; centered: boolean }) {
  return (
    <section className={`w-full ${centered ? "max-w-[380px] text-center" : "max-w-[320px] md:translate-x-1/2"}`}>
      <div className="flex flex-col gap-16">
        {kpis.map(({ value, label }, i) => (
          <SoftBlurView
            key={value}
            replayDelay={i * KPI_STEP}
            scrollOnly
            className="flex flex-col gap-3"
          >
            <p className="text-[17px] font-semibold tracking-[-0.34px] sm:text-[20px] sm:tracking-[-0.4px]">
              {value}
            </p>
            <p>{label}</p>
          </SoftBlurView>
        ))}
      </div>
    </section>
  );
}

/**
 * A project's content under its header: the intro paragraphs, then its image
 * runs and KPIs, as the home page shows it. Without `centered` the text
 * blocks sit either side of the page center;
 * `centered` puts them on it instead, with their lines centered too, in a
 * wider 380px column (320px otherwise). `intro={false}` leaves out the
 * paragraphs.
 */
export function ProjectBody({
  project,
  centered = false,
  intro = true,
}: {
  project: Project;
  centered?: boolean;
  intro?: boolean;
}) {
  const sections = getSections(project);
  // Where each image run starts in the page-wide placeholder numbering.
  const numberFrom = sections.map(
    (_, i) =>
      1 +
      sections
        .slice(0, i)
        .reduce((n, s) => n + ("images" in s ? s.images.length : 0), 0),
  );

  return (
    <>
      {/* Same horizontal position as the intro block on the home page. Narrows
          to fit on small phones, like the home blocks do. */}
      {intro && (
        <section className={`w-full ${centered ? "max-w-[380px] text-center" : "max-w-[320px] md:-translate-x-1/2"}`}>
          <SoftBlurIn className="flex flex-col gap-3">
            {project.paragraphs.map((paragraph) => (
              <SoftBlurItem key={paragraph}>
                <p>{paragraph}</p>
              </SoftBlurItem>
            ))}
          </SoftBlurIn>
        </section>
      )}

      {sections.map((section, i) =>
        "kpis" in section ? (
          <KpiBlock key={i} kpis={section.kpis} centered={centered} />
        ) : (
          <ImageRun
            key={i}
            project={project}
            images={section.images}
            first={i === 0}
            numberFrom={numberFrom[i]}
          />
        ),
      )}
    </>
  );
}
