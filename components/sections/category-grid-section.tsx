import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { stripAccents } from "@/components/shared/accent-text";
import { getAllCategories } from "@/lib/actions/product.actions";
import type { SectionData } from "@/lib/site-config";
import { cn } from "@/lib/utils";

import { Carousel } from "./carousel";
import { ImagePlaceholder } from "./image-placeholder";
import { Section, SectionHeader } from "./section-shell";

type Category = Awaited<ReturnType<typeof getAllCategories>>[number];

// One photo tile; the photo is the category's newest product
const CategoryTile = ({ category, tile }: { category: Category; tile: string }) => (
  <Link
    href={`/search?${new URLSearchParams({ category: category.slug })}`}
    className={cn(
      "group backdrop-media flex items-end rounded-[var(--radius)] text-white focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ring",
      tile,
    )}
  >
    {category.image ? (
      <Image
        src={category.image}
        alt=""
        fill
        sizes="(min-width: 1024px) 50vw, 100vw"
        className="object-cover transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none"
      />
    ) : (
      <ImagePlaceholder label="" className="absolute inset-0 text-foreground" />
    )}
    <span className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />

    <span className="relative z-[2] flex w-full items-end justify-between gap-3 p-4 sm:p-5">
      <span className="flex min-w-0 flex-col">
        <span className="text-[clamp(17px,1.8vw,22px)] font-semibold tracking-[-0.02em]">
          {category.name}
        </span>
        <span className="text-[13px] text-white/80">
          {category.count} {category.count === 1 ? "product" : "products"}
        </span>
      </span>
      <span className="hidden size-9 shrink-0 items-center justify-center rounded-full bg-white text-[#111] sm:flex transition-transform group-hover:translate-x-0.5 motion-reduce:transition-none">
        <ArrowRight className="size-4" aria-hidden="true" />
      </span>
    </span>
  </Link>
);

// Photo tiles, one per category, as a grid or a carousel
const CategoryGridSection = async ({ data }: { data: SectionData<"category_grid"> }) => {
  const categories = await getAllCategories();

  if (categories.length === 0) return null;

  // Fewer categories get wider tiles, so the row is always full
  const layout =
    categories.length >= 4
      ? { grid: "grid-cols-2 lg:grid-cols-4", tile: "aspect-[4/5]" }
      : categories.length === 3
        ? { grid: "grid-cols-2 lg:grid-cols-3", tile: "aspect-[4/5]" }
        : categories.length === 2
          ? { grid: "grid-cols-2", tile: "aspect-[4/5] sm:aspect-[4/3]" }
          : { grid: "grid-cols-1", tile: "aspect-[4/3] sm:aspect-[21/9]" };

  return (
    <Section id="categories" innerClassName="flex flex-col gap-8">
      <SectionHeader title={data.title} subtitle={data.subtitle} linkText="Shop all" linkUrl="/search" />

      {data.layout === "carousel" ? (
        <Carousel label={stripAccents(data.title)} columns="four">
          {categories.map((category) => (
            <CategoryTile key={category.slug} category={category} tile="aspect-[4/5]" />
          ))}
        </Carousel>
      ) : (
        <ul className={cn("grid gap-3 sm:gap-5", layout.grid)}>
          {categories.map((category) => (
            <li key={category.slug}>
              <CategoryTile category={category} tile={layout.tile} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
};

export default CategoryGridSection;
