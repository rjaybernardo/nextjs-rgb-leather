import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import * as Sentry from "@sentry/nextjs";

import { getPaymentSettings, getSecret } from "@/lib/integrations";

const PAYMONGO_API_URL = "https://api.paymongo.com/v1";

export type PayMongoCheckoutSession = {
  id: string;
  attributes: {
    checkout_url: string;
    reference_number?: string | null;
    status: string;
    metadata?: Record<string, string> | null;
    payments: {
      id: string;
      attributes: {
        status: string;
        amount: number;
        currency?: string;
      };
    }[];
  };
};

type CheckoutLineItem = {
  name: string;
  amount: number; // centavos
  currency: "PHP";
  quantity: number;
  images?: string[];
};

// Keys come from Admin → Settings, or PAYMONGO_SECRET_KEY
async function getAuthHeader() {
  const secretKey = await getSecret("PAYMONGO_SECRET_KEY");

  if (!secretKey) {
    throw new Error("Online payments are not configured yet");
  }

  return `Basic ${Buffer.from(`${secretKey}:`).toString("base64")}`;
}

async function paymongoRequest<T>(path: string, init?: RequestInit) {
  const response = await fetch(`${PAYMONGO_API_URL}${path}`, {
    ...init,
    headers: {
      Authorization: await getAuthHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });

  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const detail = body?.errors?.[0]?.detail;

    const error = new Error(
      typeof detail === "string"
        ? `PayMongo: ${detail}`
        : `PayMongo request failed (${response.status})`,
    );

    // Payment provider failures are worth knowing about even though the
    // customer just sees a message
    Sentry.captureException(error, {
      tags: { provider: "paymongo", status: response.status },
      extra: { path },
    });

    throw error;
  }

  return body as { data: T };
}

export const toCentavos = (amount: number) => Math.round(amount * 100);

export async function createCheckoutSession(params: {
  lineItems: CheckoutLineItem[];
  referenceNumber: string;
  description: string;
  successUrl: string;
  cancelUrl: string;
  billing: { name: string; email: string };
  metadata: Record<string, string>;
}) {
  // Wallets and cards offered in PayMongo's checkout (Admin → Settings);
  // each must be activated on the PayMongo account
  const { paymongoMethods } = await getPaymentSettings();

  const { data } = await paymongoRequest<PayMongoCheckoutSession>(
    "/checkout_sessions",
    {
      method: "POST",
      body: JSON.stringify({
        data: {
          attributes: {
            line_items: params.lineItems,
            payment_method_types: paymongoMethods,
            reference_number: params.referenceNumber,
            description: params.description,
            success_url: params.successUrl,
            cancel_url: params.cancelUrl,
            billing: params.billing,
            metadata: params.metadata,
            send_email_receipt: true,
            show_line_items: true,
            show_description: true,
          },
        },
      }),
    },
  );

  return data;
}

export async function retrieveCheckoutSession(checkoutSessionId: string) {
  const { data } = await paymongoRequest<PayMongoCheckoutSession>(
    `/checkout_sessions/${encodeURIComponent(checkoutSessionId)}`,
  );

  return data;
}

/*
 * Paymongo-Signature header: "t=<timestamp>,te=<test sig>,li=<live sig>".
 * The signature is HMAC-SHA256 of "<timestamp>.<raw body>" keyed with the
 * webhook's secret key; compare against li in live mode and te in test mode.
 */
export async function verifyWebhookSignature({
  rawBody,
  signatureHeader,
  livemode,
}: {
  rawBody: string;
  signatureHeader: string | null;
  livemode: boolean;
}) {
  const webhookSecret = await getSecret("PAYMONGO_WEBHOOK_SECRET");

  if (!webhookSecret || !signatureHeader) {
    return false;
  }

  const parts = Object.fromEntries(
    signatureHeader.split(",").map((part) => {
      const [key, ...rest] = part.trim().split("=");

      return [key, rest.join("=")];
    }),
  );

  const timestamp = parts.t;
  const expectedSignature = livemode ? parts.li : parts.te;

  if (!timestamp || !expectedSignature) {
    return false;
  }

  const computed = createHmac("sha256", webhookSecret)
    .update(`${timestamp}.${rawBody}`)
    .digest("hex");

  const computedBuffer = Buffer.from(computed, "utf8");
  const expectedBuffer = Buffer.from(expectedSignature, "utf8");

  return (
    computedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(computedBuffer, expectedBuffer)
  );
}
