import "server-only";

import { revalidatePath, updateTag } from "next/cache";
import { connection } from "next/server";
import { cache } from "react";

import { cachedQuery } from "@/lib/cached-query";
import {
  PAYMENT_METHODS,
  PAYMONGO_METHODS,
  SECRET_KEYS,
  storedIntegrationSettingsSchema,
  type PaymentMethod,
  type PayMongoMethod,
  type SecretName,
  type SecretStatus,
  type StoredIntegrationSettings,
} from "@/lib/integration-config";
import { prisma } from "@/lib/prisma";
import { decryptSecret, secretHint } from "@/lib/secrets";

/*
 * API keys and integration settings: saved in Admin → Settings, falling
 * back to environment variables. Only encrypted values are cached; keys
 * are decrypted per request and never sent to the browser.
 */
export const INTEGRATIONS_TAG = "integrations";

const integrationsCache = { tags: [INTEGRATIONS_TAG], revalidate: 300 };

// Server actions only
export function invalidateIntegrations() {
  updateTag(INTEGRATIONS_TAG);
  // The footer's payment chips and the Google button are on every page
  revalidatePath("/", "layout");
}

const cachedSecretRows = cachedQuery(
  async () =>
    (await prisma.storeSecret.findMany()).map((row) => ({
      name: row.name,
      value: row.value,
      hint: row.hint,
      updatedAt: row.updatedAt.toISOString(),
    })),
  ["store-secrets"],
  integrationsCache,
);

const cachedSettingsRow = cachedQuery(
  async () => (await prisma.integrationSettings.findUnique({ where: { id: 1 } }))?.data ?? null,
  ["integration-settings"],
  integrationsCache,
);

const getSecretRows = cache(async () => {
  await connection();
  return cachedSecretRows();
});

// A saved key, or its environment variable, or null
export const getSecret = cache(async (name: SecretName): Promise<string | null> => {
  const row = (await getSecretRows()).find((secret) => secret.name === name);
  const saved = row ? decryptSecret(name, row.value) : null;

  return saved || process.env[name] || null;
});

// Saved settings, field by field: one bad field doesn't discard the others
export const getStoredIntegrationSettings = cache(async (): Promise<StoredIntegrationSettings> => {
  await connection();

  const raw = await cachedSettingsRow();
  const data = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const result: Record<string, unknown> = {};

  for (const [key, schema] of Object.entries(storedIntegrationSettingsSchema.shape)) {
    const parsed = schema.safeParse(data[key]);
    if (parsed.success && parsed.data !== undefined) result[key] = parsed.data;
  }

  return result as StoredIntegrationSettings;
});

const listFromEnv = <T extends string>(value: string | undefined, allowed: readonly T[]) =>
  (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is T => (allowed as readonly string[]).includes(item));

// Payment settings in effect, before checking which providers have keys
export const getPaymentSettings = cache(async () => {
  const stored = await getStoredIntegrationSettings();

  const fromEnv = listFromEnv(process.env.PAYMENT_METHODS, PAYMENT_METHODS);
  const paymentMethods = stored.paymentMethods ?? (fromEnv.length ? fromEnv : [...PAYMENT_METHODS]);

  const envDefault = PAYMENT_METHODS.find((method) => method === process.env.DEFAULT_PAYMENT_METHOD);
  const defaultPaymentMethod = stored.defaultPaymentMethod ?? envDefault ?? "PayMongo";

  const paymongoValues = PAYMONGO_METHODS.map((method) => method.value);
  const paymongoFromEnv = listFromEnv<PayMongoMethod>(process.env.PAYMONGO_PAYMENT_METHODS, paymongoValues);
  const paymongoMethods = stored.paymongoMethods ?? (paymongoFromEnv.length ? paymongoFromEnv : paymongoValues);

  return { paymentMethods, defaultPaymentMethod, paymongoMethods };
});

/*
 * What customers can choose at checkout: methods turned on in admin, minus
 * PayMongo when no secret key is set (it would only fail at payment).
 */
export const getCheckoutPaymentMethods = cache(async () => {
  const settings = await getPaymentSettings();
  const hasPayMongoKey = Boolean(await getSecret("PAYMONGO_SECRET_KEY"));

  const methods: PaymentMethod[] = settings.paymentMethods.filter(
    (method) => method !== "PayMongo" || hasPayMongoKey,
  );

  const preferred = methods.includes(settings.defaultPaymentMethod) ? settings.defaultPaymentMethod : methods[0];

  return { methods, defaultMethod: preferred ?? null };
});

export const getEmailSettings = cache(async () => {
  const stored = await getStoredIntegrationSettings();

  return {
    from: stored.emailFrom || process.env.EMAIL_FROM || "",
    replyTo: stored.emailReplyTo || process.env.EMAIL_REPLY_TO || "",
  };
});

// Both parts of the Google OAuth client, or null when sign-in with Google is off
export const getGoogleCredentials = cache(async () => {
  const stored = await getStoredIntegrationSettings();
  const clientId = stored.googleClientId || process.env.AUTH_GOOGLE_ID || "";
  const clientSecret = await getSecret("AUTH_GOOGLE_SECRET");

  return clientId && clientSecret ? { clientId, clientSecret } : null;
});

// For the admin page: where each key comes from, without revealing it
export async function getSecretStatuses(): Promise<SecretStatus[]> {
  const rows = await prisma.storeSecret.findMany();

  return (Object.keys(SECRET_KEYS) as SecretName[]).map((name) => {
    const row = rows.find((secret) => secret.name === name);
    const saved = row ? decryptSecret(name, row.value) : null;
    const env = process.env[name] || null;
    const value = saved ?? env;

    return {
      name,
      source: saved ? "admin" : env ? "env" : "none",
      hint: saved ? row!.hint : env ? secretHint(env) : null,
      updatedAt: saved ? row!.updatedAt.toISOString() : null,
      unreadable: Boolean(row) && !saved,
      ...(name === "PAYMONGO_SECRET_KEY" && value
        ? { mode: value.startsWith("sk_live_") ? ("live" as const) : ("test" as const) }
        : {}),
    };
  });
}
