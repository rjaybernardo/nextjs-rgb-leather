import "server-only";

import type { Email } from "@/lib/email";
import { APP_NAME, getPaymentMethodLabel, SERVER_URL } from "@/lib/constants";
import { formatCurrency, formatId } from "@/lib/utils";

type OrderSummary = {
  id: string;
  totalPrice: number | string;
  paymentMethod: string;
  orderitems: { name: string; qty: number; price: number | string }[];
};

const orderUrl = (orderId: string) => `${SERVER_URL}/order/${orderId}`;

const itemLines = (order: OrderSummary) =>
  order.orderitems
    .map(
      (item) =>
        `- ${item.name} × ${item.qty}: ${formatCurrency(Number(item.price) * item.qty)}`,
    )
    .join("\n");

export const orderPlacedEmail = (to: string, order: OrderSummary): Email => ({
  to,
  subject: `${APP_NAME}: order ${formatId(order.id)} received`,
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

export const orderPaidEmail = (to: string, order: OrderSummary): Email => ({
  to,
  subject: `${APP_NAME}: payment received for order ${formatId(order.id)}`,
  text: [
    `We received your payment of ${formatCurrency(order.totalPrice)}.`,
    "We'll let you know when your order ships.",
    "",
    orderUrl(order.id),
  ].join("\n"),
});

export const orderShippedEmail = (to: string, orderId: string): Email => ({
  to,
  subject: `${APP_NAME}: order ${formatId(orderId)} has shipped`,
  text: [
    "Your order is on its way.",
    "",
    orderUrl(orderId),
  ].join("\n"),
});

export const orderCancelledEmail = (to: string, orderId: string): Email => ({
  to,
  subject: `${APP_NAME}: order ${formatId(orderId)} cancelled`,
  text: [
    "Your order has been cancelled. You haven't been charged.",
    "",
    orderUrl(orderId),
  ].join("\n"),
});

export const passwordResetEmail = (to: string, resetUrl: string): Email => ({
  to,
  subject: `${APP_NAME}: reset your password`,
  text: [
    "Someone asked to reset the password for your account.",
    "",
    `Reset it here (link expires in 1 hour): ${resetUrl}`,
    "",
    "If this wasn't you, ignore this email. Your password won't change.",
  ].join("\n"),
});

export const verifyEmailEmail = (to: string, verifyUrl: string): Email => ({
  to,
  subject: `${APP_NAME}: confirm your email`,
  text: [
    "Confirm your email address to finish setting up your account.",
    "",
    `Confirm here (link expires in 24 hours): ${verifyUrl}`,
  ].join("\n"),
});
