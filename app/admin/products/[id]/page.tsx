import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProductForm from "@/components/shared/admin/product-form";
import { getProductById, getProductVariantsForAdmin } from "@/lib/actions/product.actions";
import { getTaxonomyOptions } from "@/lib/actions/taxonomy.actions";

import StockHistory from "./stock-history";
import VariantsEditor from "./variants-editor";

export const metadata: Metadata = {
  title: "Update product",
};

const UpdateProductPage = async (props: {
  params: Promise<{
    id: string;
  }>;
}) => {
  const { id } = await props.params;

  const [product, options, variantData] = await Promise.all([
    getProductById(id),
    getTaxonomyOptions(),
    getProductVariantsForAdmin(id),
  ]);

  if (!product) {
    return notFound();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <h1 className="h2-bold">Update Product</h1>

      <ProductForm
        // Remount after variants change the synced price and stock
        key={`${product.price}-${product.stock}-${product.variants.length}`}
        type="Update"
        product={product}
        productId={product.id}
        categories={options.categories}
        brands={options.brands}
        hasVariants={product.variants.length > 0}
      />

      {variantData && (
        <VariantsEditor
          productId={product.id}
          basePrice={variantData.basePrice}
          images={variantData.images}
          options={variantData.options}
          variants={variantData.variants}
        />
      )}

      <StockHistory productId={product.id} />
    </div>
  );
};

export default UpdateProductPage;
