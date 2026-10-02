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
import { recordAudit } from "@/lib/audit";
import { recordStockMovement } from "@/lib/stock";
import { productInclude, toProduct } from "@/lib/product-mapper";
import {
  CATALOG_REVALIDATE_SECONDS,
  CATALOG_TAG,
  invalidateCatalog,
} from "@/lib/catalog-cache";
import { cachedQuery } from "@/lib/cached-query";

const catalogCache = {
  tags: [CATALOG_TAG],
  revalidate: CATALOG_REVALIDATE_SECONDS,
};

const cachedLatestProducts = cachedQuery(
  async (count: number) => {
    const data = await prisma.product.findMany({
      take: count,
      orderBy: { createdAt: "desc" },
      include: productInclude,
    });

    return data.map(toProduct);
  },
  ["latest-products"],
  catalogCache,
);

export async function getLatestProducts(count = LATEST_PRODUCTS_LIMIT) {
  return cachedLatestProducts(Math.min(Math.max(count, 1), 24));
}

const cachedProductBySlug = cachedQuery(
  async (slug: string) => {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: productInclude,
    });

    return product ? toProduct(product) : null;
  },
  ["product-by-slug"],
  catalogCache,
);

export async function getProductBySlug(slug: string) {
  return cachedProductBySlug(slug);
}

// Get single product by id
export async function getProductById(productId: string) {
  await requireAdmin();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: productInclude,
  });

  return product ? toProduct(product) : null;
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

const cachedProductSearch = cachedQuery(
  async ({
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
  }) => {
    const priceRange = parsePriceRange(price);
    const minRating = Number(rating);

    const where: Prisma.ProductWhereInput = {
      ...(query && query !== "all"
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { brand: { name: { contains: query, mode: "insensitive" } } },
              { category: { name: { contains: query, mode: "insensitive" } } },
            ],
          }
        : {}),
      ...(category && category !== "all" ? { category: { slug: category } } : {}),
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
        include: productInclude,
      }),
      prisma.product.count({ where }),
    ]);

    return {
      data: data.map(toProduct),
      totalPages: Math.ceil(dataCount / limit),
      totalCount: dataCount,
    };
  },
  ["product-search"],
  catalogCache,
);

export async function getAllProducts(params: {
  query: string;
  limit?: number;
  page: number;
  category?: string;
  price?: string;
  rating?: string;
  sort?: string;
}) {
  return cachedProductSearch(params);
}

// Categories that have products, with counts, for navigation and filters
const cachedCategories = cachedQuery(
  async () => {
    const categories = await prisma.category.findMany({
      orderBy: {
        name: "asc",
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
    });

    return categories
      .filter((category) => category._count.products > 0)
      .map((category) => ({
        name: category.name,
        slug: category.slug,
        count: category._count.products,
      }));
  },
  ["categories"],
  catalogCache,
);

export async function getAllCategories() {
  return cachedCategories();
}

// Featured products that have a banner image, for the home carousel
const cachedFeaturedProducts = cachedQuery(
  async () => {
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
  },
  ["featured-products"],
  catalogCache,
);

export async function getFeaturedProducts() {
  return cachedFeaturedProducts();
}

export async function deleteProduct(id: string) {
  try {
    const session = await assertAdmin();

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

    await recordAudit({
      actor: session,
      action: "product.delete",
      entityType: "product",
      entityId: id,
      details: { name: productExists.name },
    });

    invalidateCatalog();
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
    const session = await assertAdmin();

    const product = insertProductSchema.parse(data);

    const created = await prisma.$transaction(async (tx) => {
      const newProduct = await tx.product.create({
        data: product,
      });

      await recordStockMovement(tx, {
        productId: newProduct.id,
        change: newProduct.stock,
        reason: "PRODUCT_CREATED",
        actorEmail: session.user.email,
      });

      return newProduct;
    });

    await recordAudit({
      actor: session,
      action: "product.create",
      entityType: "product",
      entityId: created.id,
      details: { name: created.name },
    });

    invalidateCatalog();
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
    const session = await assertAdmin();

    const product = updateProductSchema.parse(data);

    const productExists = await prisma.product.findFirst({
      where: { id: product.id },
    });

    if (!productExists) {
      throw new Error("Product not found");
    }

    const { id, ...updateData } = product;

    const stockChange = updateData.stock - productExists.stock;

    await prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id },
        data: updateData,
      });

      await recordStockMovement(tx, {
        productId: id,
        change: stockChange,
        reason: "ADMIN_ADJUSTMENT",
        actorEmail: session.user.email,
      });
    });

    // Note which fields changed, without copying long descriptions
    const changedFields = (
      Object.keys(updateData) as (keyof typeof updateData)[]
    ).filter(
      (key) =>
        JSON.stringify(updateData[key]) !==
        JSON.stringify(
          key === "price"
            ? Number(productExists.price)
            : productExists[key as keyof typeof productExists],
        ),
    );

    await recordAudit({
      actor: session,
      action: "product.update",
      entityType: "product",
      entityId: id,
      details: {
        name: updateData.name,
        changedFields,
        ...(stockChange !== 0
          ? { stock: { before: productExists.stock, after: updateData.stock } }
          : {}),
        ...(changedFields.includes("price")
          ? {
              price: {
                before: Number(productExists.price),
                after: updateData.price,
              },
            }
          : {}),
      },
    });

    invalidateCatalog();
    revalidatePath("/admin/products");
    revalidatePath(`/product/${updateData.slug}`);

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
