"use server";

import type { CartItem } from "@/types";

export async function addItemToCart(data: CartItem) {
  void data;

  return {
    success: true,
    message: "Item added to the cart",
  };
}
