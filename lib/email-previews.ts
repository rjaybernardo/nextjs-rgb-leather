import "server-only";

import { SERVER_URL } from "@/lib/constants";
import {
  orderCancelledEmail,
  orderPaidEmail,
  orderPlacedEmail,
  orderShippedEmail,
  passwordResetEmail,
  verifyEmailEmail,
} from "@/lib/email-templates";

const SAMPLE_ORDER_ID = "8f3c2a10-5b7d-4e1a-9c2f-6d0e4b8a1c93";

const sampleOrder = (paymentMethod: string) => ({
  id: SAMPLE_ORDER_ID,
  paymentMethod,
  itemsPrice: 3298,
  shippingPrice: 0,
  taxPrice: 353.36,
  totalPrice: 3298,
  orderitems: [
    { name: "Sample Product A", qty: 1, price: 1299, image: "/images/sample-products/p1-1.jpg" },
    { name: "Sample Product B", qty: 1, price: 1999, image: "/images/sample-products/p2-1.jpg" },
  ],
  address: {
    fullName: "Juan dela Cruz",
    phone: "+639171234567",
    streetAddress: "123 Rizal St., Brgy. San Antonio",
    city: "Quezon City",
    province: "Metro Manila",
    postalCode: "1100",
  },
});

const SAMPLE_TO = "customer@example.com";

export const EMAIL_PREVIEWS = {
  order_placed_online: {
    label: "Order placed (online payment)",
    build: () => orderPlacedEmail(SAMPLE_TO, sampleOrder("PayMongo")),
  },
  order_placed_cod: {
    label: "Order placed (cash on delivery)",
    build: () => orderPlacedEmail(SAMPLE_TO, sampleOrder("CashOnDelivery")),
  },
  order_paid: {
    label: "Payment received",
    build: () => orderPaidEmail(SAMPLE_TO, sampleOrder("PayMongo")),
  },
  order_shipped: {
    label: "Order shipped",
    build: () =>
      orderShippedEmail(SAMPLE_TO, SAMPLE_ORDER_ID, {
        courier: "J&T Express",
        trackingNumber: "JT0123456789",
        cashOnDelivery: true,
      }),
  },
  order_cancelled: {
    label: "Order cancelled",
    build: () => orderCancelledEmail(SAMPLE_TO, SAMPLE_ORDER_ID),
  },
  password_reset: {
    label: "Password reset",
    build: () => passwordResetEmail(SAMPLE_TO, `${SERVER_URL}/reset-password?email=customer%40example.com&token=sample`),
  },
  verify_email: {
    label: "Confirm email",
    build: () => verifyEmailEmail(SAMPLE_TO, `${SERVER_URL}/verify-email?email=customer%40example.com&token=sample`),
  },
} as const;

export type EmailPreviewKey = keyof typeof EMAIL_PREVIEWS;

export const isEmailPreviewKey = (value: unknown): value is EmailPreviewKey =>
  typeof value === "string" && value in EMAIL_PREVIEWS;
