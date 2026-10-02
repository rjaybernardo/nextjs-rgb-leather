import type { MetadataRoute } from "next";
import { connection } from "next/server";

import { SERVER_URL } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Built per request so new products appear without a redeploy, and so
  // builds don't need a database connection
  await connection();

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      select: {
        slug: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.category.findMany({
      where: {
        products: {
          some: {},
        },
      },
      select: {
        slug: true,
      },
    }),
  ]);

  return [
    {
      url: SERVER_URL,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SERVER_URL}/search`,
      changeFrequency: "daily",
      priority: 0.8,
    },
    ...categories.map((category) => ({
      url: `${SERVER_URL}/search?category=${encodeURIComponent(category.slug)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...products.map((product) => ({
      url: `${SERVER_URL}/product/${product.slug}`,
      lastModified: product.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    })),
  ];
}
