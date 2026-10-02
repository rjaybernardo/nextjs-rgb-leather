import type { Prisma } from "@/lib/generated/prisma/client";
import { convertToPlainObject } from "@/lib/utils";

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
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{
  include: typeof productInclude;
}>;

// Plain, serializable product with category and brand as display names
export function toProduct(product: ProductWithRelations) {
  const plain = convertToPlainObject(product);

  return {
    ...plain,
    price: Number(product.price),
    rating: Number(product.rating),
    category: product.category.name,
    categorySlug: product.category.slug,
    brand: product.brand.name,
  };
}
