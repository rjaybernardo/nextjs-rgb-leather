import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const send = vi.fn();
const captureException = vi.fn();

vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

vi.mock("@/lib/site", async () => {
  const { DEFAULT_SITE_SETTINGS } = await import("@/lib/site-config");

  return {
    getSiteSettings: async () => ({
      ...DEFAULT_SITE_SETTINGS,
      siteName: "RGB Leather",
      contact: { email: "help@rgbleather.ph", phone: "", address: "" },
    }),
  };
});

vi.mock("@sentry/nextjs", () => ({
  captureException: (...args: unknown[]) => captureException(...args),
}));

const { orderPlacedEmail, passwordResetEmail } = await import("@/lib/email-templates");

// Fresh module each test so the Resend client reads the current env
const loadSendEmail = async () => {
  vi.resetModules();
  return (await import("@/lib/email")).sendEmail;
};

const order = {
  id: "11111111-2222-3333-4444-555555555555",
  totalPrice: 1449,
  paymentMethod: "CashOnDelivery",
  orderitems: [{ name: "Leather wallet", qty: 1, price: 1299 }],
};

describe("sendEmail", () => {
  beforeEach(() => {
    send.mockReset();
    captureException.mockReset();
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    delete process.env.EMAIL_FROM;
    delete process.env.EMAIL_REPLY_TO;
    vi.restoreAllMocks();
  });

  it("logs instead of sending when no API key is set", async () => {
    const sendEmail = await loadSendEmail();

    await sendEmail(await orderPlacedEmail("juan@example.com", order));

    expect(send).not.toHaveBeenCalled();
    expect(console.info).toHaveBeenCalledWith(expect.stringContaining("To: juan@example.com"));
  });

  it("sends through Resend with sender, tag and idempotency key", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.EMAIL_FROM = "RGB Leather <orders@rgbleather.ph>";
    process.env.EMAIL_REPLY_TO = "help@rgbleather.ph";
    send.mockResolvedValue({ data: { id: "email_1" }, error: null });

    const sendEmail = await loadSendEmail();
    await sendEmail(await orderPlacedEmail("juan@example.com", order));

    expect(send).toHaveBeenCalledTimes(1);

    const [payload, options] = send.mock.calls[0];

    expect(payload).toMatchObject({
      from: "RGB Leather <orders@rgbleather.ph>",
      to: "juan@example.com",
      replyTo: "help@rgbleather.ph",
      tags: [{ name: "category", value: "order_placed" }],
    });
    expect(payload.subject).toContain("order");
    expect(payload.text).toContain("₱1,449.00");
    expect(payload.text).toContain("Pay in cash when your order arrives");

    // Branded HTML alongside the plain text
    expect(payload.html).toContain("<!DOCTYPE html");
    expect(payload.html).toContain("Thanks for your order");
    expect(payload.html).toContain("#43191A");
    expect(payload.html).toContain("help@rgbleather.ph");
    expect(payload.html).toContain("Leather wallet");
    expect(options).toEqual({ idempotencyKey: `order-placed/${order.id}` });
  });

  it("sends password resets without an idempotency key", async () => {
    process.env.RESEND_API_KEY = "re_test";
    send.mockResolvedValue({ data: { id: "email_2" }, error: null });

    const sendEmail = await loadSendEmail();
    await sendEmail(await passwordResetEmail("juan@example.com", "https://x.test/reset"));

    const [payload, options] = send.mock.calls[0];

    expect(payload.tags).toEqual([{ name: "category", value: "password_reset" }]);
    expect(payload.text).toContain("https://x.test/reset");
    expect(options).toBeUndefined();
  });

  it("never throws: reports Resend errors to Sentry", async () => {
    process.env.RESEND_API_KEY = "re_test";
    send.mockResolvedValue({ data: null, error: { message: "Domain not verified" } });

    const sendEmail = await loadSendEmail();

    await expect(sendEmail(await orderPlacedEmail("juan@example.com", order))).resolves.toBeUndefined();
    expect(captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Resend: Domain not verified" }),
      expect.objectContaining({ tags: { provider: "resend", category: "order_placed" } }),
    );
  });

  it("never throws: reports network failures to Sentry", async () => {
    process.env.RESEND_API_KEY = "re_test";
    send.mockRejectedValue(new Error("fetch failed"));

    const sendEmail = await loadSendEmail();

    await expect(sendEmail(await orderPlacedEmail("juan@example.com", order))).resolves.toBeUndefined();
    expect(captureException).toHaveBeenCalledTimes(1);
  });
});
