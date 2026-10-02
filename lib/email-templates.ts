import "server-only";

import type { Email } from "@/lib/email";
import { getPaymentMethodLabel, SERVER_URL } from "@/lib/constants";
import { getSiteSettings } from "@/lib/site";
import { formatCurrency, formatId } from "@/lib/utils";

type OrderSummary = {
  id: string;
  totalPrice: number | string;
  paymentMethod: string;
  orderitems: { name: string; qty: number; price: number | string }[];
};

const orderUrl = (orderId: string) => `${SERVER_URL}/order/${orderId}`;

// The name set in Site Studio → Branding
const siteName = async () => (await getSiteSettings()).siteName;

const itemLines = (order: OrderSummary) =>
  order.orderitems
    .map(
      (item) =>
        `- ${item.name} × ${item.qty}: ${formatCurrency(Number(item.price) * item.qty)}`,
    )
    .join("\n");

export const orderPlacedEmail = async (to: string, order: OrderSummary): Promise<Email> => ({
  to,
  category: "order_placed",
  idempotencyKey: `order-placed/${order.id}`,
  subject: `${await siteName()}: order ${formatId(order.id)} received`,
  text: [
    "Thanks for your order.",
    "",
    itemLines(order),
    "",
    `Total: ${formatCurrency(order.totalPrice)} (VAT included)`,
    `Payment: ${getPaymentMethodLabel(order.paymentMethod)}`,
    "",
    order.paymentMethod === "PayMongo"
      ? `Complete your payment here: ${orderUrl(order.id)}`
      : `Pay in cash when your order arrives. Track it here: ${orderUrl(order.id)}`,
  ].join("\n"),
});

export const orderPaidEmail = async (to: string, order: OrderSummary): Promise<Email> => ({
  to,
  category: "order_paid",
  idempotencyKey: `order-paid/${order.id}`,
  subject: `${await siteName()}: payment received for order ${formatId(order.id)}`,
  text: [
    `We received your payment of ${formatCurrency(order.totalPrice)}.`,
    "We'll let you know when your order ships.",
    "",
    orderUrl(order.id),
  ].join("\n"),
});

export const orderShippedEmail = async (
  to: string,
  orderId: string,
  shipment: { courier: string; trackingNumber?: string },
): Promise<Email> => ({
  to,
  category: "order_shipped",
  idempotencyKey: `order-shipped/${orderId}`,
  subject: `${await siteName()}: order ${formatId(orderId)} has shipped`,
  text: [
    `Your order is on its way with ${shipment.courier}.`,
    shipment.trackingNumber
      ? `Tracking number: ${shipment.trackingNumber}`
      : "",
    "",
    orderUrl(orderId),
  ]
    .filter((line, index) => line !== "" || index === 2)
    .join("\n"),
});

export const orderCancelledEmail = async (to: string, orderId: string): Promise<Email> => ({
  to,
  category: "order_cancelled",
  idempotencyKey: `order-cancelled/${orderId}`,
  subject: `${await siteName()}: order ${formatId(orderId)} cancelled`,
  text: [
    "Your order has been cancelled. You haven't been charged.",
    "",
    orderUrl(orderId),
  ].join("\n"),
});

export const passwordResetEmail = async (to: string, resetUrl: string): Promise<Email> => ({
  to,
  category: "password_reset",
  subject: `${await siteName()}: reset your password`,
  text: [
    "Someone asked to reset the password for your account.",
    "",
    `Reset it here (link expires in 1 hour): ${resetUrl}`,
    "",
    "If this wasn't you, ignore this email. Your password won't change.",
  ].join("\n"),
});

export const verifyEmailEmail = async (to: string, verifyUrl: string): Promise<Email> => ({
  to,
  category: "verify_email",
  subject: `${await siteName()}: confirm your email`,
  text: [
    "Confirm your email address to finish setting up your account.",
    "",
    `Confirm here (link expires in 24 hours): ${verifyUrl}`,
  ].join("\n"),
});
