import { Metadata } from "next";

import ProductForm from "@/components/shared/admin/product-form";
import { getTaxonomyOptions } from "@/lib/actions/taxonomy.actions";
import { requireAdmin } from "@/lib/auth-guard";

export const metadata: Metadata = {
  title: "Create Product",
};

export default async function CreateProductPage() {
  await requireAdmin();

  const { categories, brands } = await getTaxonomyOptions();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Create Product</h1>
        <p className="text-muted-foreground">
          Add a new product to your store.
        </p>
      </div>

      <ProductForm type="Create" categories={categories} brands={brands} />
    </div>
  );
}
