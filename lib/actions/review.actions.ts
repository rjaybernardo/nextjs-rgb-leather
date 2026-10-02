"use server";

import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { assertRateLimit } from "@/lib/rate-limit";
import { round2 } from "@/lib/utils";
import { formatError } from "@/lib/utils/server";
import { insertReviewSchema } from "@/lib/validators";

// Only customers whose order with this product was delivered can review it
const hasReceivedProduct = (userId: string, productId: string) =>
  prisma.orderItem.findFirst({
    where: {
      productId,
      order: {
        userId,
        status: "DELIVERED",
      },
    },
    select: {
      orderId: true,
    },
  });

export async function getReviews(productId: string) {
  const reviews = await prisma.review.findMany({
    where: {
      productId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          name: true,
        },
      },
    },
  });

  return reviews.map((review) => ({
    id: review.id,
    rating: review.rating,
    title: review.title,
    description: review.description,
    isVerifiedPurchase: review.isVerifiedPurchase,
    createdAt: review.createdAt,
    userId: review.userId,
    userName: review.user.name,
  }));
}

// What the signed-in customer can do in the review section
export async function getMyReviewStatus(productId: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return { signedIn: false as const };
  }

  const [received, review] = await Promise.all([
    hasReceivedProduct(userId, productId),
    prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
      select: {
        rating: true,
        title: true,
        description: true,
      },
    }),
  ]);

  return {
    signedIn: true as const,
    canReview: Boolean(received),
    review,
  };
}

// Create or update the customer's review, then refresh the product rating
export async function upsertReview(_prevState: unknown, formData: FormData) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Sign in to write a review");
    }

    const data = insertReviewSchema.parse({
      productId: formData.get("productId"),
      rating: formData.get("rating"),
      title: formData.get("title"),
      description: formData.get("description"),
    });

    await assertRateLimit({
      key: `review:${userId}`,
      limit: 10,
      windowMs: 60 * 60 * 1000,
    });

    const product = await prisma.product.findUnique({
      where: {
        id: data.productId,
      },
      select: {
        id: true,
        slug: true,
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    if (!(await hasReceivedProduct(userId, product.id))) {
      throw new Error(
        "You can review this product once your order has been delivered",
      );
    }

    const existing = await prisma.$transaction(async (tx) => {
      const before = await tx.review.findUnique({
        where: {
          userId_productId: {
            userId,
            productId: product.id,
          },
        },
        select: {
          id: true,
        },
      });

      await tx.review.upsert({
        where: {
          userId_productId: {
            userId,
            productId: product.id,
          },
        },
        create: {
          userId,
          productId: product.id,
          rating: data.rating,
          title: data.title,
          description: data.description,
          isVerifiedPurchase: true,
        },
        update: {
          rating: data.rating,
          title: data.title,
          description: data.description,
        },
      });

      const stats = await tx.review.aggregate({
        where: {
          productId: product.id,
        },
        _avg: {
          rating: true,
        },
        _count: true,
      });

      await tx.product.update({
        where: {
          id: product.id,
        },
        data: {
          rating: round2(stats._avg.rating ?? 0),
          numReviews: stats._count,
        },
      });

      return Boolean(before);
    });

    revalidatePath(`/product/${product.slug}`);

    return {
      success: true,
      message: existing ? "Your review was updated" : "Thanks for your review",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}
