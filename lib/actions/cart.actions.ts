"use server";

import { cookies } from "next/headers";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { convertToPlainObject } from "@/lib/utils";
import { formatError } from "@/lib/utils/server";
import { cartItemSchema } from "@/lib/validator";
import type { CartItem } from "@/types";

// Add item to cart in database
export async function addItemToCart(data: z.infer<typeof cartItemSchema>) {
  try {
    // Check for session cart cookie
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;

    if (!sessionCartId) {
      throw new Error("Cart session not found");
    }

    // Get session and user ID
    const session = await auth();
    const userId = session?.user?.id;

    // Get cart from database
    const cart = await getMyCart();

    // Parse and validate submitted item data
    const item = cartItemSchema.parse(data);

    // Find product in database
    const product = await prisma.product.findUnique({
      where: {
        id: item.productId,
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Testing
    console.log({
      "Session Cart ID": sessionCartId,
      "User ID": userId,
      "Item Requested": item,
      "Product Found": product,
      cart,
    });

    return {
      success: true,
      message: "Testing Cart",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Get user cart from database
export async function getMyCart() {
  // Check for session cart cookie
  const sessionCartId = (await cookies()).get("sessionCartId")?.value;

  if (!sessionCartId) {
    return undefined;
  }

  // Get session and user ID
  const session = await auth();
  const userId = session?.user?.id;

  // Find cart for authenticated user or guest session
  const cart = await prisma.cart.findFirst({
    where: userId
      ? {
          userId,
        }
      : {
          sessionCartId,
        },
  });

  if (!cart) {
    return undefined;
  }

  // Convert Decimal values to strings
  return convertToPlainObject({
    ...cart,
    items: cart.items as CartItem[],
    itemsPrice: cart.itemsPrice.toString(),
    totalPrice: cart.totalPrice.toString(),
    shippingPrice: cart.shippingPrice.toString(),
    taxPrice: cart.taxPrice.toString(),
  });
}
