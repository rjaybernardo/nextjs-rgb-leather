import Image from "next/image";
import Link from "next/link";

import AccentText, { stripAccents } from "@/components/shared/accent-text";
import type { SectionData } from "@/lib/site-config";

import { Carousel } from "./carousel";
import { ImagePlaceholder } from "./image-placeholder";
import { Section } from "./section-shell";

// Slightly different shades of the image ground, so empty spots read as a row
const PLACEHOLDER_GROUNDS = [92, 84, 96, 88, 98, 86].map(
  (percent) => `color-mix(in oklab, var(--backdrop) ${percent}%, var(--foreground))`,
);

type GalleryImage = SectionData<"gallery">["images"][number];

const GalleryTile = ({ item, index }: { item: GalleryImage; index: number }) => (
  <div
    className="backdrop-media flex aspect-square items-center justify-center"
    style={item.imageUrl ? undefined : { background: PLACEHOLDER_GROUNDS[index % PLACEHOLDER_GROUNDS.length] }}
  >
    {item.imageUrl ? (
      <Image
        src={item.imageUrl}
        alt={item.caption}
        fill
        sizes="(min-width: 1024px) 16vw, 33vw"
        className="object-cover"
      />
    ) : (
      <ImagePlaceholder label="" />
    )}

    {item.caption && (
      <span className="absolute bottom-2 left-2.5 z-[2] rounded-full bg-[rgba(255,255,255,.9)] px-2 py-0.5 text-[11px] font-semibold text-[#18181b]">
        {item.caption}
      </span>
    )}
  </div>
);

// A row of photos, each with an optional short caption, as a grid or a carousel
const GallerySection = ({ data }: { data: SectionData<"gallery"> }) => {
  if (data.images.length === 0) return null;

  return (
    <Section className="border-t" innerClassName="flex flex-col gap-8">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="text-[clamp(24px,2.6vw,34px)] font-bold tracking-[-0.025em]">
          <AccentText text={data.title} />
        </h2>
        {data.linkText && data.linkUrl && (
          <Link href={data.linkUrl} className="text-[15px] font-semibold underline-offset-4 hover:underline">
            {data.linkText}
          </Link>
        )}
      </div>

      {data.layout === "carousel" ? (
        <Carousel label={stripAccents(data.title)} columns="six">
          {data.images.map((item, index) => (
            <GalleryTile key={`${item.imageUrl}-${index}`} item={item} index={index} />
          ))}
        </Carousel>
      ) : (
        <ul className="grid grid-cols-3 gap-3 lg:grid-cols-6">
          {data.images.map((item, index) => (
            <li key={`${item.imageUrl}-${index}`}>
              <GalleryTile item={item} index={index} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
};

export default GallerySection;
