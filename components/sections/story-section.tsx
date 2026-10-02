import Image from "next/image";
import Link from "next/link";

import type { SectionData } from "@/lib/site-config";
import { cn } from "@/lib/utils";

import { LeatherShape } from "./leather-shape";
import { Section, SectionTitle, pillButton } from "./section-shell";

const StorySection = ({ data }: { data: SectionData<"story"> }) => {
  const paragraphs = data.body.split(/\n\s*\n/).filter((paragraph) => paragraph.trim());

  return (
    <Section>
      <div className="grid items-center gap-[clamp(32px,5vw,80px)] lg:grid-cols-2">
        <div className={cn("flex min-w-0 flex-col gap-6", data.imageSide === "left" && "lg:order-2")}>
          <SectionTitle text={data.title} />

          {paragraphs.map((paragraph, index) => (
            <p key={index} className="max-w-[52ch] whitespace-pre-line text-lg text-muted-foreground">
              {paragraph}
            </p>
          ))}

          {data.ctaText && data.ctaUrl && (
            <div>
              <Link href={data.ctaUrl} className={pillButton.ghost}>
                {data.ctaText}
              </Link>
            </div>
          )}
        </div>

        <div className="backdrop-leather flex aspect-[5/4] min-w-0 items-center justify-center">
          {data.imageUrl ? (
            <Image src={data.imageUrl} alt="" fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
          ) : (
            <LeatherShape shape="tote" tone="brown" />
          )}
        </div>
      </div>
    </Section>
  );
};

export default StorySection;
