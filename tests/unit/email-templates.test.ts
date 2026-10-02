import { beforeEach, describe, expect, it, vi } from "vitest";

import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/site-config";

let settings: SiteSettings = DEFAULT_SITE_SETTINGS;

vi.mock("@/lib/site", () => ({
  getSiteSettings: async () => settings,
}));

const templates = await import("@/lib/email-templates");

const order = {
  id: "8f3c2a10-5b7d-4e1a-9c2f-6d0e4b8a1c93",
  paymentMethod: "PayMongo",
  itemsPrice: 1299,
  shippingPrice: 150,
  taxPrice: 155.25,
  totalPrice: 1449,
  orderitems: [{ name: "Classic Bifold Wallet", qty: 1, price: 1299, image: "/images/wallet.jpg" }],
  address: { fullName: "Juan dela Cruz", city: "Quezon City", province: "Metro Manila", postalCode: "1100" },
};

describe("branded HTML emails", () => {
  beforeEach(() => {
    settings = { ...DEFAULT_SITE_SETTINGS, siteName: "RGB Leather" };
  });

  it("renders every template with HTML and plain text", async () => {
    const emails = await Promise.all([
      templates.orderPlacedEmail("a@b.ph", order),
      templates.orderPaidEmail("a@b.ph", order),
      templates.orderShippedEmail("a@b.ph", order.id, { courier: "LBC Express", trackingNumber: "LBC123" }),
      templates.orderCancelledEmail("a@b.ph", order.id),
      templates.passwordResetEmail("a@b.ph", "https://shop.test/reset?token=x"),
      templates.verifyEmailEmail("a@b.ph", "https://shop.test/verify?token=x"),
    ]);

    for (const email of emails) {
      expect(email.html).toContain("<!DOCTYPE html");
      expect(email.html).toContain("RGB Leather");
      expect(email.text.length).toBeGreaterThan(20);
      expect(email.subject).toMatch(/^RGB Leather: /);
    }
  });

  it("shows order totals, VAT, address and absolute image URLs", async () => {
    const { html } = await templates.orderPlacedEmail("a@b.ph", order);

    expect(html).toContain("₱1,449.00");
    expect(html).toContain("Includes 12% VAT");
    expect(html).toContain("Quezon City, Metro Manila");
    expect(html).toMatch(/src="https?:\/\/[^"]+\/images\/wallet\.jpg"/);
    expect(html).toContain("Complete payment");
  });

  it("uses the brand color and readable button text", async () => {
    settings = { ...settings, theme: { ...settings.theme, primaryColor: "#F5D76E" } };

    const { html } = await templates.orderCancelledEmail("a@b.ph", order.id);

    expect(html).toContain("#F5D76E");
    // Light brand color gets dark button text
    expect(html).toContain("#111111");
  });

  it("falls back to the site name for SVG logos (Gmail hides SVG)", async () => {
    settings = { ...settings, logoUrl: "/images/logo.svg" };

    const { html } = await templates.orderCancelledEmail("a@b.ph", order.id);

    expect(html).not.toContain("logo.svg");
  });

  it("uses uploaded image logos with an absolute URL", async () => {
    settings = { ...settings, logoUrl: "https://abc123.ufs.sh/f/logo.png" };

    const { html } = await templates.passwordResetEmail("a@b.ph", "https://shop.test/reset");

    expect(html).toContain('src="https://abc123.ufs.sh/f/logo.png"');
  });

  it("includes the courier and tracking number when shipped", async () => {
    const { html } = await templates.orderShippedEmail("a@b.ph", order.id, {
      courier: "J&T Express",
      trackingNumber: "JT0123456789",
      cashOnDelivery: true,
    });

    expect(html).toContain("J&amp;T Express");
    expect(html).toContain("JT0123456789");
    expect(html).toContain("pay the rider in cash");
  });
});
