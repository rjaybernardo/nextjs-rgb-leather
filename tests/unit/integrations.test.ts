import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  emailSettingsSchema,
  googleSettingsSchema,
  paymentSettingsSchema,
  SECRET_KEYS,
} from "@/lib/integration-config";
import { decryptSecret, encryptSecret, secretHint } from "@/lib/secrets";

const ENV_KEYS = ["AUTH_SECRET", "SETTINGS_ENCRYPTION_KEY"] as const;
let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  process.env.AUTH_SECRET = "test-auth-secret-for-unit-tests";
  delete process.env.SETTINGS_ENCRYPTION_KEY;
});

afterEach(() => {
  for (const key of ENV_KEYS) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
});

describe("secret encryption", () => {
  const key = "sk_test_abcdefghijklmnop1234";

  it("decrypts what it encrypts", () => {
    expect(decryptSecret("PAYMONGO_SECRET_KEY", encryptSecret("PAYMONGO_SECRET_KEY", key))).toBe(key);
  });

  it("never stores the key in readable form, and differs on every save", () => {
    const first = encryptSecret("PAYMONGO_SECRET_KEY", key);
    const second = encryptSecret("PAYMONGO_SECRET_KEY", key);

    expect(first).not.toContain(key);
    expect(first).not.toBe(second);
  });

  it("can't be moved onto another key", () => {
    const stored = encryptSecret("PAYMONGO_SECRET_KEY", key);

    expect(decryptSecret("RESEND_API_KEY", stored)).toBeNull();
  });

  it("rejects a tampered value", () => {
    const stored = encryptSecret("PAYMONGO_SECRET_KEY", key);
    // Change a character in the middle (the last one can be padding bits)
    const at = Math.floor(stored.length / 2);
    const tampered = stored.slice(0, at) + (stored[at] === "A" ? "B" : "A") + stored.slice(at + 1);

    expect(decryptSecret("PAYMONGO_SECRET_KEY", tampered)).toBeNull();
    expect(decryptSecret("PAYMONGO_SECRET_KEY", "not-encrypted")).toBeNull();
  });

  it("can't be read once AUTH_SECRET changes", () => {
    const stored = encryptSecret("PAYMONGO_SECRET_KEY", key);
    process.env.AUTH_SECRET = "a-different-secret";

    expect(decryptSecret("PAYMONGO_SECRET_KEY", stored)).toBeNull();
  });

  it("prefers SETTINGS_ENCRYPTION_KEY when set", () => {
    process.env.SETTINGS_ENCRYPTION_KEY = "dedicated-encryption-key";
    const stored = encryptSecret("PAYMONGO_SECRET_KEY", key);

    // AUTH_SECRET no longer matters
    process.env.AUTH_SECRET = "rotated-auth-secret";
    expect(decryptSecret("PAYMONGO_SECRET_KEY", stored)).toBe(key);
  });

  it("shows only the last 4 characters", () => {
    expect(secretHint(key)).toBe("1234");
  });
});

describe("API key formats", () => {
  it.each([
    ["PAYMONGO_SECRET_KEY", "sk_test_abc12345", true],
    ["PAYMONGO_SECRET_KEY", "sk_live_abc12345", true],
    ["PAYMONGO_SECRET_KEY", "pk_test_abc12345", false],
    ["PAYMONGO_WEBHOOK_SECRET", "whsk_abc12345", true],
    ["PAYMONGO_WEBHOOK_SECRET", "sk_test_abc12345", false],
    ["RESEND_API_KEY", "re_abc12345", true],
    ["RESEND_API_KEY", "abc12345", false],
    ["AUTH_GOOGLE_SECRET", "GOCSPX-abcdefghij", true],
    ["AUTH_GOOGLE_SECRET", "short", false],
  ] as const)("%s %s → %s", (name, value, valid) => {
    expect(SECRET_KEYS[name].pattern.test(value)).toBe(valid);
  });
});

describe("integration settings", () => {
  it("needs at least one payment method, and the preselected one must be on", () => {
    const base = { paymentMethods: ["PayMongo", "CashOnDelivery"], defaultPaymentMethod: "PayMongo", paymongoMethods: ["gcash"] };

    expect(paymentSettingsSchema.safeParse(base).success).toBe(true);
    expect(paymentSettingsSchema.safeParse({ ...base, paymentMethods: [] }).success).toBe(false);
    expect(
      paymentSettingsSchema.safeParse({ ...base, paymentMethods: ["CashOnDelivery"], defaultPaymentMethod: "PayMongo" }).success,
    ).toBe(false);
    expect(paymentSettingsSchema.safeParse({ ...base, paymongoMethods: ["bitcoin"] }).success).toBe(false);
  });

  it("accepts a sender with or without a name", () => {
    const parse = (emailFrom: string) => emailSettingsSchema.safeParse({ emailFrom, emailReplyTo: "" }).success;

    expect(parse("")).toBe(true);
    expect(parse("orders@store.ph")).toBe(true);
    expect(parse("Your Store <orders@store.ph>")).toBe(true);
    expect(parse("Your Store")).toBe(false);
  });

  it("checks the Google client ID format", () => {
    expect(googleSettingsSchema.safeParse({ googleClientId: "123-abc.apps.googleusercontent.com" }).success).toBe(true);
    expect(googleSettingsSchema.safeParse({ googleClientId: "GOCSPX-oops" }).success).toBe(false);
  });
});
