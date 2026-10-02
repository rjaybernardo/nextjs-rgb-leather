import { VAT_RATE } from "@/lib/constants";
import type { ShippingSettings } from "@/lib/store-settings";
import { round2 } from "@/lib/utils";
import type { CartItem } from "@/types";

// Calculate cart price based on items. Prices are VAT-inclusive, so taxPrice
// is the VAT already contained in the total, not an extra charge.
export const calcPrice = (
  items: CartItem[],
  { shippingFee, freeShippingMin }: ShippingSettings,
) => {
  const itemsPrice = round2(
    items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0),
  );

  const qualifiesForFreeShipping =
    freeShippingMin > 0 && itemsPrice >= freeShippingMin;

  const shippingPrice = round2(
    items.length === 0 || qualifiesForFreeShipping ? 0 : shippingFee,
  );

  const totalPrice = round2(itemsPrice + shippingPrice);

  const taxPrice = round2((totalPrice * VAT_RATE) / (1 + VAT_RATE));

  return {
    itemsPrice: Number(itemsPrice.toFixed(2)),
    shippingPrice: Number(shippingPrice.toFixed(2)),
    taxPrice: Number(taxPrice.toFixed(2)),
    totalPrice: Number(totalPrice.toFixed(2)),
  };
};
