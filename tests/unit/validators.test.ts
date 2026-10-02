import { describe, expect, it } from "vitest";

import {
  addressSchema,
  insertReviewSchema,
  normalizePhone,
  shipmentSchema,
  shippingSettingsSchema,
  signUpFormSchema,
  updateUserSchema,
} from "@/lib/validators";

const address = {
  fullName: "Juan dela Cruz",
  phone: "0917 123 4567",
  streetAddress: "123 Rizal St., Brgy. San Antonio",
  city: "Quezon City",
  province: "Metro Manila",
  postalCode: "1100",
  country: "Philippines",
};

describe("addressSchema (Philippine addresses)", () => {
  it("accepts a complete address", () => {
    expect(addressSchema.safeParse(address).success).toBe(true);
  });

  it.each(["0917 123 4567", "09171234567", "+63 917-123-4567", "+639171234567"])(
    "accepts mobile number %s",
    (phone) => {
      expect(addressSchema.safeParse({ ...address, phone }).success).toBe(true);
    },
  );

  it.each(["02 8123 4567", "0917123456", "917 123 4567", ""])(
    "rejects %s",
    (phone) => {
      expect(addressSchema.safeParse({ ...address, phone }).success).toBe(false);
    },
  );

  it("requires a 4-digit ZIP code", () => {
    expect(addressSchema.safeParse({ ...address, postalCode: "11000" }).success).toBe(false);
    expect(addressSchema.safeParse({ ...address, postalCode: "110" }).success).toBe(false);
  });

  it("requires a province", () => {
    expect(addressSchema.safeParse({ ...address, province: "" }).success).toBe(false);
  });

  it("stores mobile numbers in +63 form", () => {
    expect(normalizePhone("+63 (917) 123-4567")).toBe("+639171234567");
    expect(normalizePhone("0917 123 4567")).toBe("+639171234567");
    expect(normalizePhone("0917-123-4567")).toBe("+639171234567");
  });
});

describe("shipmentSchema", () => {
  it("requires a known courier", () => {
    expect(shipmentSchema.safeParse({ courier: "J&T Express" }).success).toBe(true);
    expect(shipmentSchema.safeParse({ courier: "Pony Express" }).success).toBe(false);
  });

  it("treats a blank tracking number as none", () => {
    const result = shipmentSchema.parse({ courier: "LBC Express", trackingNumber: "  " });

    expect(result.trackingNumber).toBeUndefined();
  });
});

describe("insertReviewSchema", () => {
  const review = { productId: "p1", rating: "5", title: "Great belt", description: "Solid stitching." };

  it("coerces the rating from form data", () => {
    expect(insertReviewSchema.parse(review).rating).toBe(5);
  });

  it.each(["0", "6", "4.5"])("rejects rating %s", (rating) => {
    expect(insertReviewSchema.safeParse({ ...review, rating }).success).toBe(false);
  });
});

describe("account and admin schemas", () => {
  it("requires sign-up passwords of 6+ characters that match", () => {
    const base = { name: "Juan", email: "juan@example.com" };

    expect(signUpFormSchema.safeParse({ ...base, password: "12345", confirmPassword: "12345" }).success).toBe(false);
    expect(signUpFormSchema.safeParse({ ...base, password: "123456", confirmPassword: "1234567" }).success).toBe(false);
    expect(signUpFormSchema.safeParse({ ...base, password: "123456", confirmPassword: "123456" }).success).toBe(true);
  });

  it("only allows the user and admin roles", () => {
    const user = { id: "u1", name: "Juan", email: "juan@example.com" };

    expect(updateUserSchema.safeParse({ ...user, role: "admin" }).success).toBe(true);
    expect(updateUserSchema.safeParse({ ...user, role: "superadmin" }).success).toBe(false);
  });

  it("rejects negative shipping amounts", () => {
    expect(shippingSettingsSchema.safeParse({ shippingFee: "150", freeShippingMin: "3000" }).success).toBe(true);
    expect(shippingSettingsSchema.safeParse({ shippingFee: "-1", freeShippingMin: "0" }).success).toBe(false);
  });
});
