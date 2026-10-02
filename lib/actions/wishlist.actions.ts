"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertRateLimit } from "@/lib/rate-limit";
import { productInclude, toProduct } from "@/lib/product-mapper";
import { formatError } from "@/lib/utils/server";

// Product ids on the signed-in user's wishlist (empty when signed out)
export async function getMyWishlistIds() {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  const items = await prisma.wishlistItem.findMany({
    where: {
      userId: session.user.id,
    },
    select: {
      productId: true,
    },
  });

  return items.map((item) => item.productId);
}

export async function getMyWishlist() {
  const session = await auth();

  if (!session?.user?.id) {
    return [];
  }

  const items = await prisma.wishlistItem.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      product: {
        include: productInclude,
      },
    },
  });

  return items.map((item) => toProduct(item.product));
}

export async function toggleWishlist(productId: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return {
        success: false,
        requiresSignIn: true,
        message: "Sign in to save items to your wishlist",
      };
    }

    await assertRateLimit({
      key: `wishlist:${userId}`,
      limit: 60,
      windowMs: 60 * 1000,
    });

    const key = {
      userId_productId: {
        userId,
        productId,
      },
    };

    const existing = await prisma.wishlistItem.findUnique({
      where: key,
    });

    if (existing) {
      await prisma.wishlistItem.delete({
        where: key,
      });
    } else {
      const product = await prisma.product.findUnique({
        where: {
          id: productId,
        },
        select: {
          id: true,
        },
      });

      if (!product) {
        throw new Error("Product not found");
      }

      // upsert so a double click can't fail on the primary key
      await prisma.wishlistItem.upsert({
        where: key,
        create: {
          userId,
          productId,
        },
        update: {},
      });
    }

    revalidatePath("/user/wishlist");

    return {
      success: true,
      wishlisted: !existing,
      message: existing ? "Removed from your wishlist" : "Saved to your wishlist",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}
