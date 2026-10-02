import { z } from "zod";

import type { OrderStatus } from "@/lib/generated/prisma/enums";

import {
  cartItemSchema,
  insertCartSchema,
  insertOrderItemSchema,
  insertOrderSchema,
  insertProductSchema,
  shippingAddressSchema,
} from "@/lib/validators";

export type Product = z.infer<typeof insertProductSchema> & {
  id: string;
  images: string[];
  createdAt: Date;
  rating: number;
  numReviews: number;
  // Display names from the related Category and Brand rows
  category: string;
  categorySlug: string;
  brand: string;
};

export type Cart = z.infer<typeof insertCartSchema>;

export type CartItem = z.infer<typeof cartItemSchema>;

export type ShippingAddress = z.infer<typeof shippingAddressSchema>;

export type OrderItem = z.infer<typeof insertOrderItemSchema>;

export type Order = z.infer<typeof insertOrderSchema> & {
  id: string;
  createdAt: Date;
  status: OrderStatus;
  paidAt: Date | null;
  shippedAt: Date | null;
  deliveredAt: Date | null;
  cancelledAt: Date | null;
  courier: string | null;
  trackingNumber: string | null;
  discountPrice: number;
  couponCode: string | null;
  orderitems: OrderItem[];
  user: {
    name: string;
    email: string;
  };
};
