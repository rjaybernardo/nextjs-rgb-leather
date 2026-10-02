import Image from "next/image";
import Link from "next/link";

import AccentText, { stripAccents } from "@/components/shared/accent-text";
import { getReviewSummary } from "@/lib/actions/product.actions";
import type { SectionData } from "@/lib/site-config";
import { cn } from "@/lib/utils";

import { LeatherShape } from "./leather-shape";
import { pillButton } from "./section-shell";

const CALLOUT_POSITION: Record<SectionData<"hero">["callouts"][number]["position"], string> = {
  "top-left": "top-[12%] left-[6%]",
  "top-right": "top-[12%] right-[6%]",
  "middle-left": "top-[46%] left-[6%]",
  "middle-right": "top-[46%] right-[5%]",
  "bottom-left": "bottom-[9%] left-[10%]",
  "bottom-right": "bottom-[16%] right-[6%]",
};

const Stars = () => (
  <span aria-hidden="true" className="text-[15px] tracking-[2px] text-foreground">
    ★★★★★
  </span>
);

const HeroSection = async ({ data, priority }: { data: SectionData<"hero">; priority?: boolean }) => {
  const summary = data.showRating === "yes" ? await getReviewSummary() : null;
  const overlay = data.layout === "overlay" && Boolean(data.imageUrl);

  const actions = (
    <div className="flex flex-wrap gap-3">
      {data.ctaText && data.ctaUrl && (
        <Link href={data.ctaUrl} className={overlay ? pillButton.light : pillButton.dark}>
          {data.ctaText}
        </Link>
      )}
      {data.secondaryCtaText && data.secondaryCtaUrl && (
        <Link
          href={data.secondaryCtaUrl}
          className={cn(pillButton.ghost, overlay && "border-white text-white hover:bg-white hover:text-black")}
        >
          {data.secondaryCtaText}
        </Link>
      )}
    </div>
  );

  const proof = (summary?.count || data.trustPoints.length > 0) && (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-7 gap-y-3 pt-2 text-sm",
        overlay ? "text-white/80" : "text-muted-foreground",
      )}
    >
      {summary && summary.count > 0 && (
        <div className="flex items-center gap-2">
          {!overlay && <Stars />}
          <span>
            <strong className={overlay ? "text-white" : "text-foreground"}>{summary.average.toFixed(1)}</strong> from{" "}
            {summary.count.toLocaleString("en-PH")} {summary.count === 1 ? "review" : "reviews"}
          </span>
        </div>
      )}
      {data.trustPoints.map((point, index) => (
        <span key={`${point.text}-${index}`}>{point.text}</span>
      ))}
    </div>
  );

  const heading = (
    <h1 className="h-display text-[clamp(48px,6.6vw,96px)]">
      <AccentText text={data.heading} />
    </h1>
  );

  if (overlay) {
    return (
      <section className="full-bleed relative min-h-[min(80vh,44rem)] overflow-hidden text-white">
        <Image src={data.imageUrl} alt="" fill sizes="100vw" priority={priority} className="object-cover" />
        {/* Darkens the photo so the text stays readable */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/10" />

        <div className="wrap relative flex min-h-[inherit] flex-col justify-center gap-7 py-[clamp(40px,6vw,88px)]">
          <div className="max-w-3xl">{heading}</div>
          {data.subheading && <p className="max-w-[34ch] text-[clamp(17px,1.5vw,20px)] text-white/85">{data.subheading}</p>}
          {actions}
          {proof}
        </div>
      </section>
    );
  }

  return (
    <section className="full-bleed bg-background">
      <div className="wrap grid items-center gap-[clamp(32px,5vw,72px)] py-[clamp(40px,6vw,88px)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
        <div className="flex min-w-0 flex-col gap-7">
          {heading}
          {data.subheading && (
            <p className="max-w-[34ch] text-[clamp(17px,1.5vw,20px)] text-muted-foreground">{data.subheading}</p>
          )}
          {actions}
          {proof}
        </div>

        <figure className="backdrop-leather flex aspect-[5/4.4] min-w-0 items-center justify-center">
          {data.imageUrl ? (
            <Image
              src={data.imageUrl}
              alt={data.caption ? stripAccents(data.caption) : ""}
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              priority={priority}
              className="object-cover"
            />
          ) : (
            <LeatherShape shape="bifold" tone="cognac" />
          )}

          {data.callouts.map((callout, index) => (
            <span
              key={`${callout.text}-${index}`}
              className={cn(
                "absolute z-[2] flex items-center gap-2 whitespace-nowrap rounded-full bg-[rgba(245,243,238,.94)] py-[5px] pl-1.5 pr-2.5 text-[11px] font-semibold text-[#1d1a17] sm:py-[7px] sm:pl-2 sm:pr-3.5 sm:text-[13px]",
                CALLOUT_POSITION[callout.position],
              )}
            >
              <i className="inline-block size-2.5 rounded-full bg-[#1d1a17] shadow-[0_0_0_4px_rgba(29,26,23,.15)]" />
              {callout.text}
            </span>
          ))}

          {data.caption && (
            <figcaption className="absolute bottom-4 right-4 z-[2] text-xs font-medium text-[#655d54]">
              {data.caption}
            </figcaption>
          )}
        </figure>
      </div>
    </section>
  );
};

export default HeroSection;
