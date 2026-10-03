import { Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import AccentText, { stripAccents } from "@/components/shared/accent-text";
import { getReviewSummary } from "@/lib/actions/product.actions";
import type { SectionData } from "@/lib/site-config";
import { cn } from "@/lib/utils";

import HeroCarousel from "./hero-carousel";
import { ImagePlaceholder } from "./image-placeholder";
import { pillButton } from "./section-shell";

const CALLOUT_POSITION: Record<SectionData<"hero">["callouts"][number]["position"], string> = {
  "top-left": "top-[12%] left-[6%]",
  "top-right": "top-[12%] right-[6%]",
  "middle-left": "top-[46%] left-[6%]",
  "middle-right": "top-[46%] right-[5%]",
  "bottom-left": "bottom-[9%] left-[10%]",
  "bottom-right": "bottom-[16%] right-[6%]",
};

const Stars = ({ className }: { className?: string }) => (
  <span aria-hidden="true" className={cn("text-[15px] tracking-[2px]", className)}>
    ★★★★★
  </span>
);

type Slide = {
  heading: string;
  subheading: string;
  imageUrl: string;
  ctaText: string;
  ctaUrl: string;
  secondaryCtaText?: string;
  secondaryCtaUrl?: string;
};

type Summary = Awaited<ReturnType<typeof getReviewSummary>> | null;

// One banner slide; the first one also carries the photo callouts and caption
const HeroSlide = ({
  data,
  slide,
  summary,
  first,
  priority,
}: {
  data: SectionData<"hero">;
  slide: Slide;
  summary: Summary;
  first: boolean;
  priority?: boolean;
}) => {
  const overlay = data.layout === "overlay" && Boolean(slide.imageUrl);
  // One h1 per page: later slides are h2
  const Heading = first ? "h1" : "h2";

  const actions = (
    <div className="flex flex-wrap gap-3">
      {slide.ctaText && slide.ctaUrl && (
        <Link href={slide.ctaUrl} className={cn(pillButton.dark, overlay && "border-white bg-white text-[#111]")}>
          {slide.ctaText}
        </Link>
      )}
      {slide.secondaryCtaText && slide.secondaryCtaUrl && (
        <Link
          href={slide.secondaryCtaUrl}
          className={cn(pillButton.ghost, overlay && "border-white text-white hover:bg-white hover:text-black")}
        >
          {slide.secondaryCtaText}
        </Link>
      )}
    </div>
  );

  const proof = (summary?.count || data.trustPoints.length > 0) && (
    <ul
      className={cn(
        "flex flex-wrap items-center gap-x-6 gap-y-2 text-sm",
        overlay ? "text-white/85" : "text-muted-foreground",
      )}
    >
      {summary && summary.count > 0 && (
        <li className="flex items-center gap-2">
          <Stars className={overlay ? "text-amber-300" : "text-foreground"} />
          <span>
            <strong className={overlay ? "text-white" : "text-foreground"}>{summary.average.toFixed(1)}</strong> from{" "}
            {summary.count.toLocaleString("en-PH")} {summary.count === 1 ? "review" : "reviews"}
          </span>
        </li>
      )}
      {data.trustPoints.map((point, index) => (
        <li key={`${point.text}-${index}`} className="flex items-center gap-1.5">
          <Check className="size-4" strokeWidth={2.25} aria-hidden="true" />
          {point.text}
        </li>
      ))}
    </ul>
  );

  const heading = (
    <Heading className="h-display text-[clamp(38px,5vw,72px)]">
      <AccentText text={slide.heading} />
    </Heading>
  );

  if (overlay) {
    // Photo banner inset from the page edges, text on a bottom-left gradient
    return (
      <div className="relative isolate flex h-full min-h-[min(78vh,40rem)] items-end overflow-hidden rounded-[calc(var(--radius)*2)] text-white">
        <Image src={slide.imageUrl} alt="" fill sizes="100vw" priority={priority} className="-z-10 object-cover" />
        {/* Darkens the photo so the text stays readable */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/35 to-black/5 sm:bg-gradient-to-tr" />

        <div className="flex max-w-2xl flex-col gap-6 p-[clamp(24px,5vw,64px)]">
          {heading}
          {slide.subheading && (
            <p className="max-w-[40ch] text-[clamp(16px,1.4vw,19px)] text-white/85">{slide.subheading}</p>
          )}
          {actions}
          {proof}
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full items-center gap-[clamp(32px,5vw,72px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <div className="flex min-w-0 flex-col gap-6">
        {heading}
        {slide.subheading && (
          <p className="max-w-[40ch] text-[clamp(16px,1.4vw,19px)] text-muted-foreground">{slide.subheading}</p>
        )}
        {actions}
        {proof}
      </div>

      <figure className="backdrop-media flex aspect-[5/4.4] min-w-0 items-center justify-center rounded-[calc(var(--radius)*2)]">
        {slide.imageUrl ? (
          <Image
            src={slide.imageUrl}
            alt={first && data.caption ? stripAccents(data.caption) : ""}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            priority={priority}
            className="object-cover"
          />
        ) : (
          <ImagePlaceholder />
        )}

        {first &&
          data.callouts.map((callout, index) => (
            <span
              key={`${callout.text}-${index}`}
              className={cn(
                "absolute z-[2] flex items-center gap-2 whitespace-nowrap rounded-full bg-[rgba(255,255,255,.94)] py-[5px] pl-1.5 pr-2.5 text-[11px] font-semibold text-[#18181b] sm:py-[7px] sm:pl-2 sm:pr-3.5 sm:text-[13px]",
                CALLOUT_POSITION[callout.position],
              )}
            >
              <i className="inline-block size-2.5 rounded-full bg-[#18181b] shadow-[0_0_0_4px_rgba(24,24,27,.15)]" />
              {callout.text}
            </span>
          ))}

        {first && data.caption && (
          <figcaption className="absolute bottom-4 right-4 z-[2] text-xs font-medium text-[#52525b]">
            {data.caption}
          </figcaption>
        )}
      </figure>
    </div>
  );
};

// The banner: one slide, or a carousel when More slides are added in Studio
const HeroSection = async ({ data, priority }: { data: SectionData<"hero">; priority?: boolean }) => {
  const summary = data.showRating === "yes" ? await getReviewSummary() : null;

  const slides: Slide[] = [data, ...data.slides];
  const rendered = slides.map((slide, index) => (
    <HeroSlide
      key={index}
      data={data}
      slide={slide}
      summary={summary}
      first={index === 0}
      priority={priority && index === 0}
    />
  ));

  return (
    <section className="full-bleed bg-background">
      <div className={cn("wrap", data.layout === "overlay" ? "pt-3 sm:pt-5" : "py-[var(--section-y)]")}>
        {rendered.length > 1 ? (
          <HeroCarousel label={stripAccents(data.heading)} autoplay={data.autoplay === "yes"}>
            {rendered}
          </HeroCarousel>
        ) : (
          rendered[0]
        )}
      </div>
    </section>
  );
};

export default HeroSection;
