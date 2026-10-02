import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { getAllCategories } from "@/lib/actions/product.actions";
import type { SectionData } from "@/lib/site-config";

const CategoryGridSection = async ({ data }: { data: SectionData<"category_grid"> }) => {
  const categories = await getAllCategories();

  if (categories.length === 0) return null;

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="h2-bold">{data.title}</h2>
        {data.subtitle && <p className="text-muted-foreground">{data.subtitle}</p>}
      </div>

      <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {categories.map((category) => (
          <li key={category.slug}>
            <Link
              href={`/search?${new URLSearchParams({ category: category.slug })}`}
              className="group flex h-full flex-col justify-between gap-6 rounded-lg border bg-card p-5 transition-colors hover:border-primary"
            >
              <span className="text-lg font-semibold">{category.name}</span>

              <span className="flex items-center justify-between text-sm text-muted-foreground">
                {category.count} {category.count === 1 ? "product" : "products"}
                <ArrowRight
                  className="size-4 transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default CategoryGridSection;
