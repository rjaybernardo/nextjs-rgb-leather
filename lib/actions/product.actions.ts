"use server";

import { prisma } from "@/lib/prisma";
import { convertToPlainObject } from "@/lib/utils";
import { LATEST_PRODUCTS_LIMIT } from "@/lib/constants";

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
