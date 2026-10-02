import "server-only";

import { render } from "@react-email/components";
import type { ReactElement } from "react";

import AccountLinkEmail from "@/emails/account-link";
import { absoluteUrl, getEmailBrand } from "@/emails/brand";
import type { EmailAddress } from "@/emails/components/parts";
import OrderCancelledEmail from "@/emails/order-cancelled";
import OrderPaidEmail from "@/emails/order-paid";
import OrderPlacedEmail from "@/emails/order-placed";
import OrderShippedEmail from "@/emails/order-shipped";
import type { Email } from "@/lib/email";
import { getPaymentMethodLabel, SERVER_URL } from "@/lib/constants";
import { formatCurrency, formatId } from "@/lib/utils";

type OrderSummary = {
  id: string;
  totalPrice: number | string;
  paymentMethod: string;
  orderitems: {
    name: string;
    qty: number;
    price: number | string;
    image?: string | null;
    variantTitle?: string | null;
  }[];
  // Optional breakdown and address for the HTML email
  itemsPrice?: number | string;
  shippingPrice?: number | string;
  taxPrice?: number | string;
  discountPrice?: number | string;
  couponCode?: string | null;
  address?: EmailAddress | null;
};

const orderUrl = (orderId: string) => `${SERVER_URL}/order/${orderId}`;

const toNumber = (value: number | string | undefined) =>
  value === undefined ? undefined : Number(value);

// HTML version of an email; the plain-text version is written separately
const toHtml = (element: ReactElement) => render(element);

const emailItems = (order: OrderSummary) =>
  order.orderitems.map((item) => ({
    name: item.variantTitle ? `${item.name} (${item.variantTitle})` : item.name,
    qty: item.qty,
    price: Number(item.price),
    imageUrl: item.image ? absoluteUrl(item.image) : null,
  }));

const emailTotals = (order: OrderSummary) => ({
  itemsPrice: toNumber(order.itemsPrice),
  shippingPrice: toNumber(order.shippingPrice),
  taxPrice: toNumber(order.taxPrice),
  discountPrice: toNumber(order.discountPrice),
  couponCode: order.couponCode ?? undefined,
  totalPrice: Number(order.totalPrice),
});

const itemLines = (order: OrderSummary) =>
  order.orderitems
    .map((item) => `- ${item.name}${item.variantTitle ? ` (${item.variantTitle})` : ""} × ${item.qty}: ${formatCurrency(Number(item.price) * item.qty)}`)
    .join("\n");

export const orderPlacedEmail = async (to: string, order: OrderSummary): Promise<Email> => {
  const brand = await getEmailBrand();
  const payOnline = order.paymentMethod === "PayMongo";

  return {
    to,
    category: "order_placed",
    idempotencyKey: `order-placed/${order.id}`,
    subject: `${brand.siteName}: order ${formatId(order.id)} received`,
    html: await toHtml(
      <OrderPlacedEmail
        brand={brand}
        orderId={order.id}
        orderUrl={orderUrl(order.id)}
        payOnline={payOnline}
        items={emailItems(order)}
        totals={emailTotals(order)}
        address={order.address ?? undefined}
      />,
    ),
    text: [
      "Thanks for your order.",
      "",
      itemLines(order),
      "",
      ...(Number(order.discountPrice ?? 0) > 0
        ? [`Discount${order.couponCode ? ` (${order.couponCode})` : ""}: -${formatCurrency(order.discountPrice ?? 0)}`]
        : []),
      `Total: ${formatCurrency(order.totalPrice)} (VAT included)`,
      `Payment: ${getPaymentMethodLabel(order.paymentMethod)}`,
      "",
      payOnline
        ? `Complete your payment here: ${orderUrl(order.id)}`
        : `Pay in cash when your order arrives. Track it here: ${orderUrl(order.id)}`,
    ].join("\n"),
  };
};

export const orderPaidEmail = async (to: string, order: OrderSummary): Promise<Email> => {
  const brand = await getEmailBrand();

  return {
    to,
    category: "order_paid",
    idempotencyKey: `order-paid/${order.id}`,
    subject: `${brand.siteName}: payment received for order ${formatId(order.id)}`,
    html: await toHtml(
      <OrderPaidEmail
        brand={brand}
        orderId={order.id}
        orderUrl={orderUrl(order.id)}
        items={emailItems(order)}
        totals={emailTotals(order)}
      />,
    ),
    text: [
      `We received your payment of ${formatCurrency(order.totalPrice)}.`,
      "We'll let you know when your order ships.",
      "",
      orderUrl(order.id),
    ].join("\n"),
  };
};

export const orderShippedEmail = async (
  to: string,
  orderId: string,
  shipment: { courier: string; trackingNumber?: string; cashOnDelivery?: boolean },
): Promise<Email> => {
  const brand = await getEmailBrand();

  return {
    to,
    category: "order_shipped",
    idempotencyKey: `order-shipped/${orderId}`,
    subject: `${brand.siteName}: order ${formatId(orderId)} has shipped`,
    html: await toHtml(
      <OrderShippedEmail
        brand={brand}
        orderId={orderId}
        orderUrl={orderUrl(orderId)}
        courier={shipment.courier}
        trackingNumber={shipment.trackingNumber}
        cashOnDelivery={shipment.cashOnDelivery}
      />,
    ),
    text: [
      `Your order is on its way with ${shipment.courier}.`,
      ...(shipment.trackingNumber ? [`Tracking number: ${shipment.trackingNumber}`] : []),
      "",
      orderUrl(orderId),
    ].join("\n"),
  };
};

export const orderCancelledEmail = async (to: string, orderId: string): Promise<Email> => {
  const brand = await getEmailBrand();

  return {
    to,
    category: "order_cancelled",
    idempotencyKey: `order-cancelled/${orderId}`,
    subject: `${brand.siteName}: order ${formatId(orderId)} cancelled`,
    html: await toHtml(
      <OrderCancelledEmail brand={brand} orderId={orderId} orderUrl={orderUrl(orderId)} />,
    ),
    text: ["Your order has been cancelled. You haven't been charged.", "", orderUrl(orderId)].join("\n"),
  };
};

export const passwordResetEmail = async (to: string, resetUrl: string): Promise<Email> => {
  const brand = await getEmailBrand();

  return {
    to,
    category: "password_reset",
    subject: `${brand.siteName}: reset your password`,
    html: await toHtml(<AccountLinkEmail brand={brand} kind="reset" url={resetUrl} />),
    text: [
      "Someone asked to reset the password for your account.",
      "",
      `Reset it here (link expires in 1 hour): ${resetUrl}`,
      "",
      "If this wasn't you, ignore this email. Your password won't change.",
    ].join("\n"),
  };
};

export const verifyEmailEmail = async (to: string, verifyUrl: string): Promise<Email> => {
  const brand = await getEmailBrand();

  return {
    to,
    category: "verify_email",
    subject: `${brand.siteName}: confirm your email`,
    html: await toHtml(<AccountLinkEmail brand={brand} kind="verify" url={verifyUrl} />),
    text: [
      "Confirm your email address to finish setting up your account.",
      "",
      `Confirm here (link expires in 24 hours): ${verifyUrl}`,
    ].join("\n"),
  };
};
