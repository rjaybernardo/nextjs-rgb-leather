import "server-only";

import { cache } from "react";

import { FREE_SHIPPING_MIN, SHIPPING_FEE } from "@/lib/constants";
import { prisma } from "@/lib/prisma";

export type ShippingSettings = {
  shippingFee: number;
  freeShippingMin: number;
};

// Saved settings, falling back to SHIPPING_FEE / FREE_SHIPPING_MIN from the
// environment until an admin saves them. Cached for the current request.
export const getShippingSettings = cache(
  async (): Promise<ShippingSettings> => {
    const settings = await prisma.storeSettings.findUnique({
      where: {
        id: 1,
      },
    });

    return {
      shippingFee: settings ? Number(settings.shippingFee) : SHIPPING_FEE,
      freeShippingMin: settings
        ? Number(settings.freeShippingMin)
        : FREE_SHIPPING_MIN,
    };
  },
);
