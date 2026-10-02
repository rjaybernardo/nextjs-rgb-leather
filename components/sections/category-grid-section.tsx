import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { getAllCategories } from "@/lib/actions/product.actions";
import type { SectionData } from "@/lib/site-config";

import { Section, SectionTitle } from "./section-shell";

const CategoryGridSection = async ({ data }: { data: SectionData<"category_grid"> }) => {
  const categories = await getAllCategories();

  if (categories.length === 0) return null;

  return (
    <Section innerClassName="flex flex-col gap-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionTitle text={data.title} />
        {data.subtitle && <p className="max-w-[40ch] text-muted-foreground">{data.subtitle}</p>}
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/search?${new URLSearchParams({ category: category.slug })}`}
              className="group flex h-full min-h-40 flex-col justify-between gap-6 rounded-md bg-[var(--backdrop)] p-5 transition-colors hover:bg-foreground hover:text-background sm:p-6"
            >
              <span className="text-[clamp(20px,2vw,26px)] font-semibold tracking-[-0.02em]">{category.name}</span>

              <span className="flex items-center justify-between text-sm opacity-75">
                {category.count} {category.count === 1 ? "piece" : "pieces"}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1 motion-reduce:transition-none"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
};

export default CategoryGridSection;
