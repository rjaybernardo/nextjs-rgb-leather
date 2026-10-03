import { z } from "zod";

/*
 * Integrations managed in Admin → Settings: which API keys can be saved
 * there, and the non-secret settings that go with them. Shared by the
 * server (lib/integrations.ts) and the admin forms.
 */

// ---------------------------------------------------------------- secrets

export const SECRET_KEYS = {
  PAYMONGO_SECRET_KEY: {
    label: "PayMongo secret key",
    help: "PayMongo Dashboard → Developers → API keys. Use the sk_test_ key while testing.",
    pattern: /^sk_(test|live)_\S{8,}$/,
    error: "PayMongo secret keys start with sk_test_ or sk_live_",
  },
  PAYMONGO_WEBHOOK_SECRET: {
    label: "PayMongo webhook secret",
    help: "Shown when you create the webhook in PayMongo (Developers → Webhooks). Confirms payment notifications really come from PayMongo.",
    pattern: /^whsk_\S{8,}$/,
    error: "PayMongo webhook secrets start with whsk_",
  },
  RESEND_API_KEY: {
    label: "Resend API key",
    help: "Resend → API Keys. Without one, emails are only written to the server log.",
    pattern: /^re_\S{8,}$/,
    error: "Resend API keys start with re_",
  },
  AUTH_GOOGLE_SECRET: {
    label: "Google client secret",
    help: "Google Cloud Console → APIs & Services → Credentials → your OAuth client.",
    pattern: /^\S{10,}$/,
    error: "That doesn't look like a Google client secret",
  },
} as const;

export type SecretName = keyof typeof SECRET_KEYS;

export const isSecretName = (value: string): value is SecretName => value in SECRET_KEYS;

// Where a key comes from: saved in admin, the hosting environment, or nowhere
export type SecretStatus = {
  name: SecretName;
  source: "admin" | "env" | "none";
  // Last 4 characters of the key in use
  hint: string | null;
  updatedAt: string | null;
  // Saved in admin but can't be decrypted (AUTH_SECRET changed); enter it again
  unreadable: boolean;
  // PayMongo secret key only
  mode?: "test" | "live";
};

// ---------------------------------------------------------------- settings

export const PAYMENT_METHODS = ["PayMongo", "CashOnDelivery"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  PayMongo: "GCash, Maya, card or QR Ph",
  CashOnDelivery: "Cash on Delivery",
};

// Payment options inside PayMongo's checkout; each must be activated on
// the PayMongo account
export const PAYMONGO_METHODS = [
  { value: "gcash", label: "GCash" },
  { value: "paymaya", label: "Maya" },
  { value: "card", label: "Credit or debit card" },
  { value: "qrph", label: "QR Ph" },
] as const;

export type PayMongoMethod = (typeof PAYMONGO_METHODS)[number]["value"];

const paymongoMethodValues = PAYMONGO_METHODS.map((method) => method.value) as [PayMongoMethod, ...PayMongoMethod[]];

// "Store <orders@store.ph>" or a bare address
const emailSender = z
  .string()
  .trim()
  .max(200)
  .refine(
    (value) => value === "" || /^[^<>@\s][^<>]*<[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+>$|^[^<>\s@]+@[^<>\s@]+\.[^<>\s@]+$/.test(value),
    "Use an address like orders@yourstore.ph or Your Store <orders@yourstore.ph>",
  );

export const paymentSettingsSchema = z
  .object({
    paymentMethods: z.array(z.enum(PAYMENT_METHODS)).min(1, "Turn on at least one payment method"),
    defaultPaymentMethod: z.enum(PAYMENT_METHODS),
    paymongoMethods: z.array(z.enum(paymongoMethodValues)).min(1, "Choose at least one way to pay through PayMongo"),
  })
  .refine((data) => data.paymentMethods.includes(data.defaultPaymentMethod), {
    message: "The preselected method must be one that's turned on",
    path: ["defaultPaymentMethod"],
  });

export const emailSettingsSchema = z.object({
  emailFrom: emailSender,
  emailReplyTo: z.union([z.literal(""), z.email({ error: "Enter a valid email address" })]),
});

export const googleSettingsSchema = z.object({
  googleClientId: z
    .string()
    .trim()
    .max(200)
    .refine(
      (value) => value === "" || /^\S+\.apps\.googleusercontent\.com$/.test(value),
      "Google client IDs end with .apps.googleusercontent.com",
    ),
});

// Stored as one JSON row; every field is optional so anything not saved in
// admin falls back to its environment variable
export const storedIntegrationSettingsSchema = z
  .object({
    paymentMethods: z.array(z.enum(PAYMENT_METHODS)).min(1),
    defaultPaymentMethod: z.enum(PAYMENT_METHODS),
    paymongoMethods: z.array(z.enum(paymongoMethodValues)).min(1),
    emailFrom: emailSender,
    emailReplyTo: z.string(),
    googleClientId: z.string(),
  })
  .partial();

export type StoredIntegrationSettings = z.infer<typeof storedIntegrationSettingsSchema>;
