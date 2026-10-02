import { describe, expect, it } from "vitest";

import { calcPrice } from "@/lib/cart-pricing";

const item = (price: number, qty: number) => ({
  productId: "p1",
  name: "Leather wallet",
  slug: "leather-wallet",
  image: "/images/wallet.jpg",
  price,
  qty,
});

const shipping = { shippingFee: 150, freeShippingMin: 3000 };

describe("calcPrice", () => {
  it("charges nothing for an empty cart", () => {
    expect(calcPrice([], shipping)).toEqual({
      itemsPrice: 0,
      shippingPrice: 0,
      taxPrice: 0,
      totalPrice: 0,
    });
  });

  it("adds the flat shipping fee below the free-shipping minimum", () => {
    const prices = calcPrice([item(1299, 1)], shipping);

    expect(prices.itemsPrice).toBe(1299);
    expect(prices.shippingPrice).toBe(150);
    expect(prices.totalPrice).toBe(1449);
  });

  it("ships free at exactly the minimum", () => {
    const prices = calcPrice([item(1500, 2)], shipping);

    expect(prices.shippingPrice).toBe(0);
    expect(prices.totalPrice).toBe(3000);
  });

  it("always charges shipping when the minimum is 0", () => {
    const prices = calcPrice([item(10000, 1)], {
      shippingFee: 150,
      freeShippingMin: 0,
    });

    expect(prices.shippingPrice).toBe(150);
  });

  it("reports VAT as the 12% already included in the total", () => {
    // 1449 × 12/112 = 155.25
    expect(calcPrice([item(1299, 1)], shipping).taxPrice).toBe(155.25);
    // VAT is not added on top
    const { itemsPrice, shippingPrice, totalPrice } = calcPrice(
      [item(1299, 1)],
      shipping,
    );
    expect(totalPrice).toBe(itemsPrice + shippingPrice);
  });

  it("rounds to centavos", () => {
    const prices = calcPrice([item(19.99, 3)], shipping);

    expect(prices.itemsPrice).toBe(59.97);
    expect(prices.totalPrice).toBe(209.97);
  });
});
