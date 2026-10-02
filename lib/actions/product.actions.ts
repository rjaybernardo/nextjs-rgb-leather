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
import { recordStockMovement, syncProductFromVariants } from "@/lib/stock";
import { variantTitle, variantsInputSchema, type VariantsInput } from "@/lib/variant-utils";
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

    // Products with variants get price and stock from their variants
    const variantCount = await prisma.productVariant.count({ where: { productId: id } });

    if (variantCount > 0) {
      updateData.price = Number(productExists.price);
      updateData.stock = productExists.stock;
    }

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

// Admin: an editable copy of a product's options and variants
export async function getProductVariantsForAdmin(productId: string) {
  await requireAdmin();

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      price: true,
      images: true,
      options: true,
      variants: { orderBy: { position: "asc" } },
    },
  });

  if (!product) return null;

  return {
    basePrice: Number(product.price),
    images: product.images,
    options: product.variants.length > 0 ? (product.options as { name: string; values: string[] }[]) : [],
    variants: product.variants.map((variant) => ({
      id: variant.id,
      title: variant.title,
      options: variant.options as Record<string, string>,
      sku: variant.sku ?? "",
      price: String(variant.price === null ? Number(product.price) : Number(variant.price)),
      stock: String(variant.stock),
      image: variant.image ?? "",
    })),
  };
}

// Admin: replace a product's options and variants in one go
export async function saveProductVariants(productId: string, input: VariantsInput) {
  try {
    const session = await assertAdmin();
    const data = variantsInputSchema.parse(input);

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, slug: true, name: true, images: true },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    const allowedImages = new Set(product.images);

    await prisma.$transaction(async (tx) => {
      const existing = await tx.productVariant.findMany({ where: { productId } });
      const existingById = new Map(existing.map((variant) => [variant.id, variant]));
      const keptIds = new Set<string>();
      const stockChanges: { title: string; change: number }[] = [];

      for (const [position, variant] of data.variants.entries()) {
        const title = variantTitle(data.options, variant.options);
        const previous = variant.id ? existingById.get(variant.id) : undefined;
        const fields = {
          options: variant.options,
          title,
          sku: variant.sku,
          price: variant.price,
          stock: variant.stock,
          image: variant.image && allowedImages.has(variant.image) ? variant.image : null,
          position,
        };

        if (previous) {
          keptIds.add(previous.id);
          await tx.productVariant.update({ where: { id: previous.id }, data: fields });
        } else {
          await tx.productVariant.create({ data: { ...fields, productId } });
        }

        const change = variant.stock - (previous?.stock ?? 0);

        if (change !== 0) stockChanges.push({ title, change });
      }

      // Variants that were removed; past orders keep their snapshot
      const removed = existing.filter((variant) => !keptIds.has(variant.id));

      if (removed.length > 0) {
        await tx.productVariant.deleteMany({ where: { id: { in: removed.map((variant) => variant.id) } } });

        for (const variant of removed) {
          if (variant.stock > 0) stockChanges.push({ title: variant.title, change: -variant.stock });
        }
      }

      await tx.product.update({
        where: { id: productId },
        data: { options: data.variants.length > 0 ? data.options : [] },
      });

      await syncProductFromVariants(tx, productId);

      // Logged after syncing, so "left" shows the product's final total
      for (const { title, change } of stockChanges) {
        await recordStockMovement(tx, {
          productId,
          change,
          reason: "ADMIN_ADJUSTMENT",
          actorEmail: session.user.email,
          variantTitle: title,
        });
      }
    });

    await recordAudit({
      actor: session,
      action: "product.variants.update",
      entityType: "product",
      entityId: productId,
      details: {
        name: product.name,
        options: data.options.map((option) => `${option.name}: ${option.values.join(", ")}`),
        variants: data.variants.length,
      },
    });

    invalidateCatalog();
    revalidatePath(`/product/${product.slug}`);
    revalidatePath(`/admin/products/${productId}`);

    return {
      success: true,
      message:
        data.variants.length > 0
          ? `${data.variants.length} variant${data.variants.length === 1 ? "" : "s"} saved`
          : "Variants removed",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Store-wide rating for the home page: average, count and stars breakdown
const cachedReviewSummary = cachedQuery(
  async () => {
    const groups = await prisma.review.groupBy({
      by: ["rating"],
      _count: { _all: true },
    });

    const distribution = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: groups.find((group) => group.rating === stars)?._count._all ?? 0,
    }));
    const count = distribution.reduce((sum, row) => sum + row.count, 0);
    const total = distribution.reduce((sum, row) => sum + row.stars * row.count, 0);

    return { count, average: count > 0 ? Math.round((total / count) * 10) / 10 : 0, distribution };
  },
  ["review-summary"],
  catalogCache,
);

export async function getReviewSummary() {
  return cachedReviewSummary();
}
