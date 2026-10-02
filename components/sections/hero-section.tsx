import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { SectionData } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const HeroSection = ({ data, priority }: { data: SectionData<"hero">; priority?: boolean }) => {
  const hasImage = Boolean(data.imageUrl);
  const centered = data.align === "center";

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-lg",
        hasImage ? "min-h-80 text-white md:min-h-[28rem]" : "bg-muted",
      )}
    >
      {hasImage && (
        <>
          <Image
            src={data.imageUrl}
            alt=""
            fill
            sizes="100vw"
            priority={priority}
            className="object-cover"
          />
          {/* Darkens the photo so white text stays readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/10" />
        </>
      )}

      <div
        className={cn(
          "relative flex min-h-[inherit] flex-col justify-center gap-4 p-8 md:p-14",
          centered ? "items-center text-center" : "items-start",
        )}
      >
        <h1 className="max-w-2xl text-balance text-4xl font-bold tracking-tight md:text-5xl">
          {data.heading}
        </h1>

        {data.subheading && (
          <p className={cn("max-w-xl text-lg", hasImage ? "text-white/85" : "text-muted-foreground")}>
            {data.subheading}
          </p>
        )}

        {data.ctaText && data.ctaUrl && (
          <Link href={data.ctaUrl} className={buttonVariants({ size: "lg", className: "mt-2" })}>
            {data.ctaText}
          </Link>
        )}
      </div>
    </section>
  );
};

export default HeroSection;
