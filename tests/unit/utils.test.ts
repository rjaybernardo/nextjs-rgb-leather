import { describe, expect, it } from "vitest";

import {
  formatAddress,
  formatCurrency,
  getSafeCallbackUrl,
  round2,
} from "@/lib/utils";

describe("getSafeCallbackUrl", () => {
  it.each([
    [null, "/"],
    ["", "/"],
    ["/cart?step=2", "/cart?step=2"],
    ["http://localhost:3000/admin/overview", "/admin/overview"],
    ["https://evil.example/steal", "/steal"],
    ["//evil.example", "/"],
    ["/\\evil.example", "/"],
    ["http://a//evil.example", "/evil.example"],
    ["javascript:alert(1)", "/"],
    ["http://[", "/"],
  ])("maps %s to %s", (input, expected) => {
    expect(getSafeCallbackUrl(input)).toBe(expected);
  });

  it("never returns a protocol-relative URL", () => {
    for (const input of ["////evil.example", "https://x////evil.example/a"]) {
      expect(getSafeCallbackUrl(input).startsWith("//")).toBe(false);
    }
  });
});

describe("formatting helpers", () => {
  it("formats pesos", () => {
    expect(formatCurrency(12345.5)).toBe("₱12,345.50");
    expect(formatCurrency("99")).toBe("₱99.00");
  });

  it("rounds to 2 decimals", () => {
    expect(round2(1.005)).toBe(1.01);
    expect(round2("2.345")).toBe(2.35);
  });

  it("formats Philippine and older addresses", () => {
    expect(
      formatAddress({
        streetAddress: "123 Rizal St.",
        city: "Quezon City",
        province: "Metro Manila",
        postalCode: "1100",
        country: "Philippines",
      }),
    ).toBe("123 Rizal St., Quezon City, Metro Manila 1100, Philippines");

    expect(
      formatAddress({
        streetAddress: "123 Main St",
        city: "Anytown",
        postalCode: "12345",
        country: "USA",
      }),
    ).toBe("123 Main St, Anytown 12345, USA");
  });
});
