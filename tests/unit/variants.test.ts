import { describe, expect, it } from "vitest";

import { sameCartLine } from "@/lib/validators";
import {
  combinations,
  findVariant,
  parseOptions,
  priceRange,
  productOptionsSchema,
  variantTitle,
  variantsInputSchema,
} from "@/lib/variant-utils";

const options = [
  { name: "Color", values: ["Black", "Brown"] },
  { name: "Size", values: ["S", "M", "L"] },
];

const variant = (color: string, size: string, price = 1000, stock = 5) => ({
  id: `${color}-${size}`,
  title: `${color} / ${size}`,
  options: { Color: color, Size: size },
  sku: null,
  price,
  stock,
  image: null,
});

describe("variant helpers", () => {
  it("generates every combination in option order", () => {
    const combos = combinations(options);

    expect(combos).toHaveLength(6);
    expect(combos[0]).toEqual({ Color: "Black", Size: "S" });
    expect(combos[5]).toEqual({ Color: "Brown", Size: "L" });
    expect(combinations([])).toEqual([]);
  });

  it("titles variants in option order", () => {
    expect(variantTitle(options, { Size: "M", Color: "Brown" })).toBe("Brown / M");
  });

  it("finds a variant by its full selection only", () => {
    const variants = [variant("Black", "S"), variant("Brown", "M")];

    expect(findVariant(variants, { Color: "Brown", Size: "M" })?.id).toBe("Brown-M");
    expect(findVariant(variants, { Color: "Brown", Size: "S" })).toBeUndefined();
    expect(findVariant(variants, { Color: "Brown" })).toBeUndefined();
  });

  it("works out the price range for From labels", () => {
    expect(priceRange([variant("Black", "S", 1000), variant("Brown", "M", 1200)])).toEqual({ min: 1000, max: 1200 });
    expect(priceRange([])).toBeNull();
  });

  it("ignores malformed stored options", () => {
    expect(parseOptions("nope")).toEqual([]);
    expect(parseOptions(options)).toEqual(options);
  });
});

describe("option rules", () => {
  it("rejects duplicate option names and values", () => {
    expect(productOptionsSchema.safeParse([{ name: "Size", values: ["S"] }, { name: "size", values: ["M"] }]).success).toBe(false);
    expect(productOptionsSchema.safeParse([{ name: "Size", values: ["S", "s"] }]).success).toBe(false);
  });

  it("allows at most 3 options", () => {
    const four = ["A", "B", "C", "D"].map((name) => ({ name, values: ["1"] }));

    expect(productOptionsSchema.safeParse(four).success).toBe(false);
  });
});

describe("saving variants", () => {
  const row = (color: string, size: string, sku = "") => ({
    options: { Color: color, Size: size },
    sku,
    price: "1200",
    stock: "3",
    image: "",
  });

  it("accepts variants that match the options and coerces numbers", () => {
    const parsed = variantsInputSchema.parse({ options, variants: [row("Black", "S"), row("Brown", "L")] });

    expect(parsed.variants[0]).toMatchObject({ price: 1200, stock: 3, sku: null, image: null });
  });

  it("requires generating variants when options are set", () => {
    expect(variantsInputSchema.safeParse({ options, variants: [] }).success).toBe(false);
  });

  it("allows removing all variants", () => {
    expect(variantsInputSchema.safeParse({ options: [], variants: [] }).success).toBe(true);
  });

  it("rejects duplicate SKUs and rows that don't match the options", () => {
    expect(variantsInputSchema.safeParse({ options, variants: [row("Black", "S", "BELT-1"), row("Brown", "S", "BELT-1")] }).success).toBe(false);
    expect(variantsInputSchema.safeParse({ options, variants: [row("Green", "S")] }).success).toBe(false);
  });

  it("rejects negative stock and a zero price", () => {
    expect(variantsInputSchema.safeParse({ options, variants: [{ ...row("Black", "S"), stock: "-1" }] }).success).toBe(false);
    expect(variantsInputSchema.safeParse({ options, variants: [{ ...row("Black", "S"), price: "0" }] }).success).toBe(false);
  });
});

describe("cart lines", () => {
  it("treats each variant of a product as its own line", () => {
    expect(sameCartLine({ productId: "p", variantId: "a" }, { productId: "p", variantId: "a" })).toBe(true);
    expect(sameCartLine({ productId: "p", variantId: "a" }, { productId: "p", variantId: "b" })).toBe(false);
    expect(sameCartLine({ productId: "p" }, { productId: "p", variantId: undefined })).toBe(true);
    expect(sameCartLine({ productId: "p" }, { productId: "p", variantId: "a" })).toBe(false);
  });
});
