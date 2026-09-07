"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { convertToPlainObject, round2 } from "@/lib/utils";
import { formatError } from "@/lib/utils/server";
import { cartItemSchema, insertCartSchema } from "@/lib/validator";
import type { CartItem } from "@/types";

// Calculate cart price based on items
const calcPrice = (items: z.infer<typeof cartItemSchema>[]) => {
  const itemsPrice = round2(
    items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0),
  );

  const shippingPrice = round2(itemsPrice > 100 ? 0 : 10);

  const taxPrice = round2(0.15 * itemsPrice);

  const totalPrice = round2(itemsPrice + shippingPrice + taxPrice);

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
};

// Add item to cart
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

    // Get existing cart
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

    // Create a new cart if one does not already exist
    if (!cart) {
      const newCart = insertCartSchema.parse({
        userId,
        sessionCartId,
        items: [item],
        ...calcPrice([item]),
      });

      await prisma.cart.create({
        data: newCart,
      });

      // Revalidate the product page
      revalidatePath(`/product/${product.slug}`);

      return {
        success: true,
        message: "Item added to cart successfully",
      };
    }

    return {
      success: true,
      message: "Item already exists in cart",
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
