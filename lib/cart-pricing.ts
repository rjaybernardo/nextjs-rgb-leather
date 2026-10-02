import { VAT_RATE } from "@/lib/constants";
import type { ShippingSettings } from "@/lib/store-settings";
import { round2 } from "@/lib/utils";
import type { CartItem } from "@/types";

// A coupon's effect, independent of whether it's currently usable
export type DiscountRule = {
  type: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  // Percent (1-100) or pesos
  value: number;
  // Cap for percent discounts, in pesos
  maxDiscount: number | null;
};

// Peso amount a rule takes off, never more than what it applies to
export function computeDiscount(
  rule: DiscountRule,
  itemsPrice: number,
  shippingPrice: number,
) {
  switch (rule.type) {
    case "PERCENT": {
      const amount = round2((itemsPrice * rule.value) / 100);
      const capped = rule.maxDiscount !== null ? Math.min(amount, rule.maxDiscount) : amount;
      return Math.min(capped, itemsPrice);
    }
    case "FIXED":
      return Math.min(round2(rule.value), itemsPrice);
    case "FREE_SHIPPING":
      return shippingPrice;
  }
}

// Calculate cart price based on items. Prices are VAT-inclusive, so taxPrice
// is the VAT already contained in the total, not an extra charge. A discount
// (including free shipping) is shown as one amount taken off the total.
export const calcPrice = (
  items: CartItem[],
  { shippingFee, freeShippingMin }: ShippingSettings,
  discount?: DiscountRule | null,
) => {
  const itemsPrice = round2(
    items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0),
  );

  const qualifiesForFreeShipping =
    freeShippingMin > 0 && itemsPrice >= freeShippingMin;

  const shippingPrice = round2(
    items.length === 0 || qualifiesForFreeShipping ? 0 : shippingFee,
  );

  const discountPrice =
    discount && items.length > 0
      ? round2(computeDiscount(discount, itemsPrice, shippingPrice))
      : 0;

  const totalPrice = round2(itemsPrice + shippingPrice - discountPrice);

  const taxPrice = round2((totalPrice * VAT_RATE) / (1 + VAT_RATE));

  return {
    itemsPrice: Number(itemsPrice.toFixed(2)),
    shippingPrice: Number(shippingPrice.toFixed(2)),
    discountPrice: Number(discountPrice.toFixed(2)),
    taxPrice: Number(taxPrice.toFixed(2)),
    totalPrice: Number(totalPrice.toFixed(2)),
  };
};
