import { describe, expect, it } from "vitest";

import { calcPrice, computeDiscount } from "@/lib/cart-pricing";
import { couponStatus, describeDiscount, toManilaInput } from "@/lib/coupon-format";
import { couponSchema } from "@/lib/validators";

const item = (price: number, qty = 1) => ({
  productId: "p",
  name: "Wallet",
  slug: "wallet",
  image: "/i.jpg",
  price,
  qty,
});

const shipping = { shippingFee: 150, freeShippingMin: 3000 };

describe("computeDiscount", () => {
  it("takes a percentage of the items total", () => {
    expect(computeDiscount({ type: "PERCENT", value: 10, maxDiscount: null }, 1299, 150)).toBe(129.9);
  });

  it("caps percent discounts at the maximum", () => {
    expect(computeDiscount({ type: "PERCENT", value: 50, maxDiscount: 500 }, 5000, 0)).toBe(500);
  });

  it("never takes more than the items total", () => {
    expect(computeDiscount({ type: "FIXED", value: 2000, maxDiscount: null }, 1299, 150)).toBe(1299);
  });

  it("free shipping waives exactly the shipping fee", () => {
    expect(computeDiscount({ type: "FREE_SHIPPING", value: 0, maxDiscount: null }, 1299, 150)).toBe(150);
    expect(computeDiscount({ type: "FREE_SHIPPING", value: 0, maxDiscount: null }, 3500, 0)).toBe(0);
  });
});

describe("calcPrice with a discount", () => {
  it("subtracts the discount and recalculates the included VAT", () => {
    const prices = calcPrice([item(1299)], shipping, { type: "FIXED", value: 200, maxDiscount: null });

    expect(prices).toMatchObject({
      itemsPrice: 1299,
      shippingPrice: 150,
      discountPrice: 200,
      totalPrice: 1249,
    });
    // 1249 × 12/112
    expect(prices.taxPrice).toBe(133.82);
  });

  it("free shipping shows the fee and takes it back off", () => {
    const prices = calcPrice([item(1299)], shipping, { type: "FREE_SHIPPING", value: 0, maxDiscount: null });

    expect(prices.shippingPrice).toBe(150);
    expect(prices.discountPrice).toBe(150);
    expect(prices.totalPrice).toBe(1299);
  });

  it("has no discount without a code or with an empty cart", () => {
    expect(calcPrice([item(1299)], shipping).discountPrice).toBe(0);
    expect(calcPrice([], shipping, { type: "FIXED", value: 100, maxDiscount: null }).discountPrice).toBe(0);
  });
});

describe("couponSchema", () => {
  const base = {
    code: " welcome10 ",
    description: "",
    type: "PERCENT" as const,
    value: "10",
    maxDiscount: "",
    minOrder: "0",
    startsAt: "",
    endsAt: "",
    usageLimit: "",
    perCustomerLimit: "1",
    active: true,
  };

  it("uppercases codes and turns blanks into no limit", () => {
    const parsed = couponSchema.parse(base);

    expect(parsed.code).toBe("WELCOME10");
    expect(parsed.usageLimit).toBeNull();
    expect(parsed.maxDiscount).toBeNull();
    expect(parsed.perCustomerLimit).toBe(1);
  });

  it("reads dates as Philippine time", () => {
    const parsed = couponSchema.parse({ ...base, endsAt: "2026-12-31T23:59" });

    expect(parsed.endsAt?.toISOString()).toBe("2026-12-31T15:59:00.000Z");
    expect(toManilaInput(parsed.endsAt)).toBe("2026-12-31T23:59");
  });

  it.each([
    [{ value: "0" }, "Percent must be between 1 and 100"],
    [{ value: "150" }, "Percent must be between 1 and 100"],
    [{ type: "FIXED", value: "0" }, "Enter an amount above ₱0"],
    [{ code: "a b" }, "Use 3 to 30 letters"],
    [{ startsAt: "2026-12-01T00:00", endsAt: "2026-11-01T00:00" }, "End must be after the start"],
  ])("rejects %o", (change, message) => {
    const result = couponSchema.safeParse({ ...base, ...change });

    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message).join(" ")).toContain(message);
  });
});

describe("coupon display", () => {
  const coupon = {
    type: "PERCENT" as const,
    value: 10,
    maxDiscount: 500,
    minOrder: 0,
    startsAt: null,
    endsAt: null,
    usageLimit: 100,
    usedCount: 3,
    active: true,
  };

  it("describes discounts in plain words", () => {
    expect(describeDiscount(coupon)).toBe("10% off (up to ₱500.00)");
    expect(describeDiscount({ type: "FIXED", value: 200, maxDiscount: null })).toBe("₱200.00 off");
    expect(describeDiscount({ type: "FREE_SHIPPING", value: 0, maxDiscount: null })).toBe("Free shipping");
  });

  it("works out the status", () => {
    const now = new Date("2026-10-02T00:00:00Z");

    expect(couponStatus(coupon, now)).toBe("active");
    expect(couponStatus({ ...coupon, active: false }, now)).toBe("paused");
    expect(couponStatus({ ...coupon, usedCount: 100 }, now)).toBe("used_up");
    expect(couponStatus({ ...coupon, endsAt: new Date("2026-10-01T00:00:00Z") }, now)).toBe("expired");
    expect(couponStatus({ ...coupon, startsAt: new Date("2026-11-01T00:00:00Z") }, now)).toBe("scheduled");
  });
});
