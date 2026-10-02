import Image from "next/image";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import type { SectionData } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const StorySection = ({ data }: { data: SectionData<"story"> }) => {
  const paragraphs = data.body.split(/\n\s*\n/).filter((paragraph) => paragraph.trim());

  return (
    <section className="grid items-center gap-8 md:grid-cols-2">
      <div className={cn("space-y-4", data.imageSide === "left" && "md:order-2")}>
        <h2 className="h2-bold">{data.title}</h2>

        {paragraphs.map((paragraph, index) => (
          <p key={index} className="whitespace-pre-line text-muted-foreground">
            {paragraph}
          </p>
        ))}

        {data.ctaText && data.ctaUrl && (
          <Link href={data.ctaUrl} className={buttonVariants({ variant: "outline" })}>
            {data.ctaText}
          </Link>
        )}
      </div>

      {data.imageUrl && (
        <div className="relative aspect-[4/3] overflow-hidden rounded-lg">
          <Image src={data.imageUrl} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
        </div>
      )}
    </section>
  );
};

export default StorySection;
