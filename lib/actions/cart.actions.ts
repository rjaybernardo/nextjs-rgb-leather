"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calcPrice } from "@/lib/cart-pricing";
import { getShippingSettings } from "@/lib/store-settings";
import { convertToPlainObject } from "@/lib/utils";
import { formatError } from "@/lib/utils/server";
import { cartItemSchema } from "@/lib/validators";
import type { CartItem } from "@/types";

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

    // Validate submitted item; only productId and qty are trusted
    const { productId, qty } = cartItemSchema.parse(data);

    if (qty < 1) {
      throw new Error("Quantity must be at least 1");
    }

    // Find product
    const product = await prisma.product.findUnique({
      where: {
        id: productId,
      },
    });

    if (!product) {
      throw new Error("Product not found");
    }

    // Build the item from the database so the client can't set the price
    const item: CartItem = {
      productId: product.id,
      name: product.name,
      slug: product.slug,
      image: product.images[0] ?? "",
      price: Number(product.price),
      qty,
    };

    // Get existing cart
    const cart = await getMyCart();

    const existItem = cart?.items.find(
      (cartItem) => cartItem.productId === item.productId,
    );

    if ((existItem?.qty ?? 0) + item.qty > product.stock) {
      throw new Error("Not enough stock");
    }

    // If cart exists, update it
    if (cart) {
      if (existItem) {
        // Increase quantity and refresh details of existing item
        Object.assign(existItem, { ...item, qty: existItem.qty + item.qty });
      } else {
        // Add new item
        cart.items.push(item);
      }

      // Recalculate prices
      const prices = calcPrice(cart.items, await getShippingSettings());

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
      const prices = calcPrice([item], await getShippingSettings());

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
    const prices = calcPrice(cart.items, await getShippingSettings());

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
