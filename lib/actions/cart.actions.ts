"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { calcPrice } from "@/lib/cart-pricing";
import { checkCoupon } from "@/lib/coupons";
import { getShippingSettings } from "@/lib/store-settings";
import { convertToPlainObject, formatCurrency } from "@/lib/utils";
import { assertRateLimit } from "@/lib/rate-limit";
import { formatError } from "@/lib/utils/server";
import { cartItemSchema } from "@/lib/validators";
import type { CartItem } from "@/types";

// Add item to cart
/*
 * Prices a cart, keeping its discount code only while it still applies
 * (e.g. dropping it if the cart falls below the code's minimum order).
 */
async function priceCart(
  items: CartItem[],
  couponCode: string | null | undefined,
  userId: string | undefined,
) {
  const shipping = await getShippingSettings();
  const base = calcPrice(items, shipping);

  if (!couponCode || !userId || items.length === 0) {
    return { ...base, couponCode: null };
  }

  const check = await checkCoupon(couponCode, { userId, itemsPrice: base.itemsPrice });

  return check.ok
    ? { ...calcPrice(items, shipping, check.rule), couponCode: check.coupon.code }
    : { ...base, couponCode: null };
}

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
      const prices = await priceCart(cart.items, cart.couponCode, userId);

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
      const prices = await priceCart([item], null, userId);

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
    const prices = await priceCart(cart.items, cart.couponCode, (await auth())?.user?.id);

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
    discountPrice: Number(cart.discountPrice),
  };
}

// Checkout: apply a discount code to the signed-in customer's cart
export async function applyCoupon(rawCode: string) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      throw new Error("Sign in to use a discount code");
    }

    await assertRateLimit({
      key: `coupon:${userId}`,
      limit: 15,
      windowMs: 15 * 60 * 1000,
    });

    const cart = await getMyCart();

    if (!cart || cart.items.length === 0) {
      throw new Error("Your cart is empty");
    }

    const base = calcPrice(cart.items, await getShippingSettings());
    const check = await checkCoupon(rawCode, { userId, itemsPrice: base.itemsPrice });

    if (!check.ok) {
      return { success: false, message: check.message };
    }

    const prices = calcPrice(cart.items, await getShippingSettings(), check.rule);

    if (prices.discountPrice === 0) {
      return {
        success: false,
        message: `${check.coupon.code} doesn't lower this order (shipping is already free)`,
      };
    }

    await prisma.cart.update({
      where: { id: cart.id },
      data: { ...prices, couponCode: check.coupon.code },
    });

    revalidatePath("/place-order");
    revalidatePath("/cart");

    return {
      success: true,
      message: `${check.coupon.code} applied: you save ${formatCurrency(prices.discountPrice)}`,
    };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function removeCoupon() {
  try {
    const cart = await getMyCart();

    if (!cart) {
      throw new Error("Cart not found");
    }

    const prices = calcPrice(cart.items, await getShippingSettings());

    await prisma.cart.update({
      where: { id: cart.id },
      data: { ...prices, couponCode: null },
    });

    revalidatePath("/place-order");
    revalidatePath("/cart");

    return { success: true, message: "Discount code removed" };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
