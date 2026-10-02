import type { Metadata } from "next";

import { getTaxonomyWithCounts } from "@/lib/actions/taxonomy.actions";

import TaxonomyList from "./taxonomy-list";

export const metadata: Metadata = {
  title: "Categories & Brands",
};

export default async function CategoriesPage() {
  const { categories, brands } = await getTaxonomyWithCounts();

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <h1 className="h2-bold">Categories &amp; Brands</h1>
        <p className="text-sm text-muted-foreground">
          Products are filed under these. Categories also appear in the
          storefront&apos;s Shop menu once they have products.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <TaxonomyList kind="category" title="Categories" items={categories} />
        <TaxonomyList kind="brand" title="Brands" items={brands} />
      </div>
    </div>
  );
}
