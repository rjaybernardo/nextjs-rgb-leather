import { createHmac } from "node:crypto";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { toCentavos, verifyWebhookSignature } from "@/lib/paymongo";

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

  it("accepts a valid test-mode signature", () => {
    expect(verify(`t=${timestamp},te=${sign(rawBody)},li=`)).toBe(true);
  });

  it("accepts a valid live-mode signature", () => {
    expect(verify(`t=${timestamp},te=,li=${sign(rawBody)}`, true)).toBe(true);
  });

  it("rejects a test signature for a live event", () => {
    expect(verify(`t=${timestamp},te=${sign(rawBody)},li=`, true)).toBe(false);
  });

  it("rejects a tampered body", () => {
    expect(verify(`t=${timestamp},te=${sign(rawBody)},li=`, false, `${rawBody} `)).toBe(false);
  });

  it("rejects a changed timestamp", () => {
    expect(verify(`t=1700000001,te=${sign(rawBody)},li=`)).toBe(false);
  });

  it("rejects a signature made with another secret", () => {
    expect(verify(`t=${timestamp},te=${sign(rawBody, timestamp, "other")},li=`)).toBe(false);
  });

  it("rejects a missing header or missing secret", () => {
    expect(verify(null)).toBe(false);

    delete process.env.PAYMONGO_WEBHOOK_SECRET;
    expect(verify(`t=${timestamp},te=${sign(rawBody)},li=`)).toBe(false);
  });
});

describe("toCentavos", () => {
  it("converts pesos to whole centavos", () => {
    expect(toCentavos(1449)).toBe(144900);
    expect(toCentavos(19.99)).toBe(1999);
    expect(toCentavos(0.1 + 0.2)).toBe(30);
  });
});
