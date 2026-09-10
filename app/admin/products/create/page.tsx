import { Metadata } from "next";

import ProductForm from "@/components/shared/admin/product-form";
import { requireAdmin } from "@/lib/auth-guard";

export const metadata: Metadata = {
  title: "Create Product",
};

export default async function CreateProductPage() {
  await requireAdmin();

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Create Product</h1>
        <p className="text-muted-foreground">
          Add a new product to your store.
        </p>
      </div>

      <ProductForm type="Create" />
    </div>
  );
}
