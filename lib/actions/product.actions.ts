"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { LATEST_PRODUCTS_LIMIT, PAGE_SIZE } from "@/lib/constants";
import { assertAdmin, requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { convertToPlainObject } from "@/lib/utils";
import { formatError } from "@/lib/utils/server";
import { insertProductSchema, updateProductSchema } from "@/lib/validators";
import { Prisma } from "@/lib/generated/prisma/client";

export async function getLatestProducts() {
  const data = await prisma.product.findMany({
    take: LATEST_PRODUCTS_LIMIT,
    orderBy: { createdAt: "desc" },
  });

  const plainData = convertToPlainObject(data);

  return plainData.map((product) => ({
    ...product,
    price: Number(product.price),
    rating: Number(product.rating),
  }));
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
  });

  if (!product) return null;

  return {
    ...convertToPlainObject(product),
    price: Number(product.price),
    rating: Number(product.rating),
  };
}

// Get single product by id
export async function getProductById(productId: string) {
  await requireAdmin();

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) return null;

  return {
    ...convertToPlainObject(product),
    price: Number(product.price),
    rating: Number(product.rating),
  };
}

export type ProductSort = "newest" | "lowest" | "highest" | "rating";

// Parses a "min-max" price filter, e.g. "1000-5000" or "5000-"
const parsePriceRange = (price?: string) => {
  if (!price || price === "all") return undefined;

  const [min, max] = price.split("-").map((value) => Number(value));

  const range: Prisma.DecimalFilter = {};

  if (Number.isFinite(min) && min > 0) range.gte = min;
  if (Number.isFinite(max) && max > 0) range.lte = max;

  return Object.keys(range).length > 0 ? range : undefined;
};

const PRODUCT_ORDER_BY: Record<
  ProductSort,
  Prisma.ProductOrderByWithRelationInput[]
> = {
  newest: [{ createdAt: "desc" }],
  lowest: [{ price: "asc" }, { createdAt: "desc" }],
  highest: [{ price: "desc" }, { createdAt: "desc" }],
  rating: [{ rating: "desc" }, { numReviews: "desc" }],
};

export async function getAllProducts({
  query,
  limit = PAGE_SIZE,
  page,
  category,
  price,
  rating,
  sort = "newest",
}: {
  query: string;
  limit?: number;
  page: number;
  category?: string;
  price?: string;
  rating?: string;
  sort?: string;
}) {
  const priceRange = parsePriceRange(price);
  const minRating = Number(rating);

  const where: Prisma.ProductWhereInput = {
    ...(query && query !== "all"
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { brand: { contains: query, mode: "insensitive" } },
            { category: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(category && category !== "all" ? { category } : {}),
    ...(priceRange ? { price: priceRange } : {}),
    ...(Number.isFinite(minRating) && minRating > 0
      ? { rating: { gte: minRating } }
      : {}),
  };

  const orderBy =
    PRODUCT_ORDER_BY[sort as ProductSort] ?? PRODUCT_ORDER_BY.newest;

  const [data, dataCount] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  const plainData = convertToPlainObject(data);

  return {
    data: plainData.map((product) => ({
      ...product,
      price: Number(product.price),
      rating: Number(product.rating),
    })),
    totalPages: Math.ceil(dataCount / limit),
    totalCount: dataCount,
  };
}

// Categories with how many products each has, for navigation and filters
export async function getAllCategories() {
  const groups = await prisma.product.groupBy({
    by: ["category"],
    _count: true,
    orderBy: {
      category: "asc",
    },
  });

  return groups.map((group) => ({
    category: group.category,
    count: group._count,
  }));
}

// Featured products that have a banner image, for the home carousel
export async function getFeaturedProducts() {
  const data = await prisma.product.findMany({
    where: {
      isFeatured: true,
      banner: {
        not: null,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  return convertToPlainObject(data).map((product) => ({
    id: product.id,
    name: product.name,
    slug: product.slug,
    banner: product.banner as string,
  }));
}

export async function deleteProduct(id: string) {
  try {
    await assertAdmin();

    const productExists = await prisma.product.findFirst({
      where: { id },
    });

    if (!productExists) {
      throw new Error("Product not found");
    }

    const orderItemCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (orderItemCount > 0) {
      throw new Error("Product has existing orders and cannot be deleted");
    }

    await prisma.product.delete({
      where: { id },
    });

    revalidatePath("/admin/products");

    return {
      success: true,
      message: "Product deleted successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function createProduct(data: z.input<typeof insertProductSchema>) {
  try {
    await assertAdmin();

    const product = insertProductSchema.parse(data);

    await prisma.product.create({
      data: product,
    });

    revalidatePath("/admin/products");

    return {
      success: true,
      message: "Product created successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

export async function updateProduct(data: z.input<typeof updateProductSchema>) {
  try {
    await assertAdmin();

    const product = updateProductSchema.parse(data);

    const productExists = await prisma.product.findFirst({
      where: { id: product.id },
    });

    if (!productExists) {
      throw new Error("Product not found");
    }

    const { id, ...updateData } = product;

    await prisma.product.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/admin/products");

    return {
      success: true,
      message: "Product updated successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}
