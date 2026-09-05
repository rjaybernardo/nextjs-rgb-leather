"use server";

import { LATEST_PRODUCTS_LIMIT } from "@/lib/constants";
import { prisma } from "@/lib/prisma";
import { convertToPlainObject } from "@/lib/utils";

export async function getLatestProducts() {
  const data = await prisma.product.findMany({
    take: LATEST_PRODUCTS_LIMIT,
    orderBy: {
      createdAt: "desc",
    },
  });

  const plainData = convertToPlainObject(data);

  return plainData.map((product) => ({
    ...product,
    price: Number(product.price),
    rating: Number(product.rating),
  }));
}

// Get a single product by slug
export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: {
      slug,
    },
  });

  if (!product) {
    return null;
  }

  return {
    ...convertToPlainObject(product),
    price: Number(product.price),
    rating: Number(product.rating),
  };
}
