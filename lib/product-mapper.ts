import type { Prisma } from "@/lib/generated/prisma/client";
import { convertToPlainObject } from "@/lib/utils";
import { parseOptions, parseSelection, type VariantView } from "@/lib/variant-utils";

// Relations every storefront product query loads
export const productInclude = {
  category: {
    select: {
      name: true,
      slug: true,
    },
  },
  brand: {
    select: {
      name: true,
    },
  },
  variants: {
    orderBy: { position: "asc" },
    select: {
      id: true,
      title: true,
      options: true,
      sku: true,
      price: true,
      stock: true,
      image: true,
    },
  },
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

// Plain, serializable product with category and brand as display names
export function toProduct(product: ProductWithRelations) {
  const plain = convertToPlainObject(product);
  const price = Number(product.price);

  const variants: VariantView[] = product.variants.map((variant) => ({
    id: variant.id,
    title: variant.title,
    options: parseSelection(variant.options),
    sku: variant.sku,
    price: variant.price === null ? price : Number(variant.price),
    stock: variant.stock,
    image: variant.image,
  }));

  return {
    ...plain,
    price,
    rating: Number(product.rating),
    category: product.category.name,
    categorySlug: product.category.slug,
    brand: product.brand.name,
    options: variants.length > 0 ? parseOptions(product.options) : [],
    variants,
  };
}
