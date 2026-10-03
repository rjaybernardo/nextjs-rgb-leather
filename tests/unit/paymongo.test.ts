import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { toCentavos, verifyWebhookSignature } from "@/lib/paymongo";

// No keys saved in Admin → Settings, so the environment variables are used
vi.mock("@/lib/prisma", () => ({
  prisma: {
    storeSecret: { findMany: async () => [] },
    integrationSettings: { findUnique: async () => null },
  },
}));

vi.mock("next/server", () => ({ connection: async () => {} }));

// unstable_cache needs a running Next.js server; call queries directly
vi.mock("@/lib/cached-query", () => ({ cachedQuery: (fn: unknown) => fn }));


const SECRET = "whsk_test_secret";
const rawBody = JSON.stringify({
  data: { attributes: { type: "checkout_session.payment.paid", livemode: false } },
});
const timestamp = "1700000000";
const sign = (body: string, t = timestamp, secret = SECRET) =>
  createHmac("sha256", secret).update(`${t}.${body}`).digest("hex");

describe("verifyWebhookSignature", () => {
  beforeEach(() => {
    process.env.PAYMONGO_WEBHOOK_SECRET = SECRET;
  });

  afterEach(() => {
    delete process.env.PAYMONGO_WEBHOOK_SECRET;
  });

  const verify = (header: string | null, livemode = false, body = rawBody) =>
    verifyWebhookSignature({ rawBody: body, signatureHeader: header, livemode });

  it("accepts a valid test-mode signature", async () => {
    expect(await verify(`t=${timestamp},te=${sign(rawBody)},li=`)).toBe(true);
  });

  it("accepts a valid live-mode signature", async () => {
    expect(await verify(`t=${timestamp},te=,li=${sign(rawBody)}`, true)).toBe(true);
  });

  it("rejects a test signature for a live event", async () => {
    expect(await verify(`t=${timestamp},te=${sign(rawBody)},li=`, true)).toBe(false);
  });

  it("rejects a tampered body", async () => {
    expect(await verify(`t=${timestamp},te=${sign(rawBody)},li=`, false, `${rawBody} `)).toBe(false);
  });

  it("rejects a changed timestamp", async () => {
    expect(await verify(`t=1700000001,te=${sign(rawBody)},li=`)).toBe(false);
  });

  it("rejects a signature made with another secret", async () => {
    expect(await verify(`t=${timestamp},te=${sign(rawBody, timestamp, "other")},li=`)).toBe(false);
  });

  it("rejects a missing header or missing secret", async () => {
    expect(await verify(null)).toBe(false);

    delete process.env.PAYMONGO_WEBHOOK_SECRET;
    expect(await verify(`t=${timestamp},te=${sign(rawBody)},li=`)).toBe(false);
  });
});

describe("toCentavos", () => {
  it("converts pesos to whole centavos", () => {
    expect(toCentavos(1449)).toBe(144900);
    expect(toCentavos(19.99)).toBe(1999);
    expect(toCentavos(0.1 + 0.2)).toBe(30);
  });
});
