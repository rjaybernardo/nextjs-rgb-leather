"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { LATEST_PRODUCTS_LIMIT, PAGE_SIZE } from "@/lib/constants";
import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { convertToPlainObject } from "@/lib/utils";
import { formatError } from "@/lib/utils/server";
import { insertProductSchema, updateProductSchema } from "@/lib/validators";

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

export async function getAllProducts({
  limit = PAGE_SIZE,
  page,
}: {
  query: string;
  limit?: number;
  page: number;
  category?: string;
}) {
  const data = await prisma.product.findMany({
    skip: (page - 1) * limit,
    take: limit,
  });

  const dataCount = await prisma.product.count();
  const plainData = convertToPlainObject(data);

  return {
    data: plainData.map((product) => ({
      ...product,
      price: Number(product.price),
      rating: Number(product.rating),
    })),
    totalPages: Math.ceil(dataCount / limit),
  };
}

export async function deleteProduct(id: string) {
  await requireAdmin();

  try {
    const productExists = await prisma.product.findFirst({
      where: { id },
    });

    if (!productExists) {
      throw new Error("Product not found");
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
  await requireAdmin();

  try {
    const product = insertProductSchema.parse(data);

    await prisma.product.create({
      data: {
        ...product,
        images: [],
      },
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
  await requireAdmin();

  try {
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
