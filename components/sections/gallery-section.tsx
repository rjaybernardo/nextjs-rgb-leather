import Image from "next/image";
import Link from "next/link";

import AccentText from "@/components/shared/accent-text";
import type { SectionData } from "@/lib/site-config";

import { LEATHER_TONES, LeatherShape, type LeatherShapeKind } from "./leather-shape";
import { Section } from "./section-shell";

const PLACEHOLDER_SHAPES: LeatherShapeKind[] = ["card", "tote", "sleeve", "tote", "strap", "card"];
const PLACEHOLDER_GROUNDS = ["#CFC6B8", "#B9AD9B", "#D9D1C3", "#C7BBA9", "#DCD5C9", "#BFB4A3"];

// Customer photos, each with a short caption like "4 years"
const GallerySection = ({ data }: { data: SectionData<"gallery"> }) => {
  if (data.images.length === 0) return null;

  return (
    <Section className="border-t" innerClassName="flex flex-col gap-8 py-[clamp(56px,7vw,96px)]">
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

      <ul className="grid grid-cols-3 gap-3 lg:grid-cols-6">
        {data.images.map((item, index) => (
          <li
            key={`${item.imageUrl}-${index}`}
            className="backdrop-leather flex aspect-square items-center justify-center"
            style={item.imageUrl ? undefined : { background: PLACEHOLDER_GROUNDS[index % PLACEHOLDER_GROUNDS.length] }}
          >
            {item.imageUrl ? (
              <Image
                src={item.imageUrl}
                alt={item.caption ? `Carried for ${item.caption}` : ""}
                fill
                sizes="(min-width: 1024px) 16vw, 33vw"
                className="object-cover"
              />
            ) : (
              <LeatherShape
                shape={PLACEHOLDER_SHAPES[index % PLACEHOLDER_SHAPES.length]}
                tone={LEATHER_TONES[(index + 2) % LEATHER_TONES.length]}
              />
            )}

            {item.caption && (
              <span className="absolute bottom-2 left-2.5 z-[2] rounded-full bg-[rgba(245,243,238,.9)] px-2 py-0.5 text-[11px] font-semibold text-[#2a2420]">
                {item.caption}
              </span>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
};

export default GallerySection;
