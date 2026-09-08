"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { convertToPlainObject, round2 } from "@/lib/utils";
import { formatError } from "@/lib/utils/server";
import { cartItemSchema } from "@/lib/validators";
import type { CartItem } from "@/types";

// Calculate cart price based on items
const calcPrice = (items: CartItem[]) => {
  const itemsPrice = round2(
    items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0),
  );

  const shippingPrice = round2(itemsPrice > 100 ? 0 : 10);

  const taxPrice = round2(0.15 * itemsPrice);

  const totalPrice = round2(itemsPrice + shippingPrice + taxPrice);

  return {
    itemsPrice: Number(itemsPrice.toFixed(2)),
    shippingPrice: Number(shippingPrice.toFixed(2)),
    taxPrice: Number(taxPrice.toFixed(2)),
    totalPrice: Number(totalPrice.toFixed(2)),
  };
};

// Add item to cart
export async function addItemToCart(data: z.infer<typeof cartItemSchema>) {
  try {
    // Get session cart ID
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;

    if (!sessionCartId) {
      throw new Error("Cart session not found");
    }

    // Get current user
    const session = await auth();
    const userId = session?.user?.id;

    // Validate submitted item
    const item = cartItemSchema.parse(data);

    // Find product
    const product = await prisma.product.findUnique({
      where: {
        id: item.productId,
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Get existing cart
    const cart = await getMyCart();

    // If cart exists, update it
    if (cart) {
      const existItem = cart.items.find(
        (cartItem) => cartItem.productId === item.productId,
      );

      if (existItem) {
        // Increase quantity of existing item
        existItem.qty += item.qty;
      } else {
        // Add new item
        cart.items.push(item);
      }

      // Recalculate prices
      const prices = calcPrice(cart.items);

      // Update cart
      await prisma.cart.update({
        where: {
          id: cart.id,
        },
        data: {
          items: cart.items,
          ...prices,
        },
      });
    } else {
      // Create a new cart
      const prices = calcPrice([item]);

      await prisma.cart.create({
        data: {
          sessionCartId,
          userId,
          items: [item],
          ...prices,
        },
      });
    }

    // Revalidate product page
    revalidatePath(`/product/${product.slug}`);

    return {
      success: true,
      message: `${product.name} added to cart successfully`,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Remove one quantity of an item from the cart
export async function removeItemFromCart(productId: string) {
  try {
    // Get session cart ID
    const sessionCartId = (await cookies()).get("sessionCartId")?.value;

    if (!sessionCartId) {
      throw new Error("Cart session not found");
    }

    // Get product
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Get user cart
    const cart = await getMyCart();

    if (!cart) {
      throw new Error("Cart not found");
    }

    // Check if cart has item
    const exist = cart.items.find((item) => item.productId === productId);

    if (!exist) {
      throw new Error("Item not found");
    }

    // If only one remains, remove the item
    if (exist.qty === 1) {
      cart.items = cart.items.filter((item) => item.productId !== productId);
    } else {
      // Otherwise decrease quantity by one
      exist.qty -= 1;
    }

    // Recalculate cart prices
    const prices = calcPrice(cart.items);

    // Update cart in database
    await prisma.cart.update({
      where: {
        id: cart.id,
      },
      data: {
        items: cart.items,
        ...prices,
      },
    });

    // Revalidate product page
    revalidatePath(`/product/${product.slug}`);

    return {
      success: true,
      message: `${product.name} ${
        cart.items.some((item) => item.productId === productId)
          ? "updated in"
          : "removed from"
      } cart successfully`,
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}

// Get current user's cart
export async function getMyCart() {
  const sessionCartId = (await cookies()).get("sessionCartId")?.value;

  if (!sessionCartId) {
    return undefined;
  }

  const session = await auth();
  const userId = session?.user?.id;

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

  return {
    ...convertToPlainObject(cart),
    items: cart.items as CartItem[],
    itemsPrice: Number(cart.itemsPrice),
    totalPrice: Number(cart.totalPrice),
    shippingPrice: Number(cart.shippingPrice),
    taxPrice: Number(cart.taxPrice),
  };
}
