import { z } from "zod";

/*
 * Product options and variants, shared by the admin editor, the product
 * page and the server. A product with no options has no variants and works
 * as before.
 */

export const MAX_OPTIONS = 3;
export const MAX_VALUES_PER_OPTION = 12;
export const MAX_VARIANTS = 60;

export type ProductOption = { name: string; values: string[] };

// { Color: "Brown", Size: "M" }
export type VariantSelection = Record<string, string>;

export type VariantView = {
  id: string;
  title: string;
  options: VariantSelection;
  sku: string | null;
  price: number;
  stock: number;
  image: string | null;
};

export const productOptionsSchema = z
  .array(
    z.object({
      name: z.string().trim().min(1, "Name each option").max(30),
      values: z
        .array(z.string().trim().min(1).max(40))
        .min(1, "Give each option at least one value")
        .max(MAX_VALUES_PER_OPTION, `Up to ${MAX_VALUES_PER_OPTION} values per option`),
    }),
  )
  .max(MAX_OPTIONS, `Up to ${MAX_OPTIONS} options`)
  .superRefine((options, ctx) => {
    const names = options.map((option) => option.name.toLowerCase());

    if (new Set(names).size !== names.length) {
      ctx.addIssue({ code: "custom", message: "Option names must be different" });
    }

    for (const option of options) {
      const values = option.values.map((value) => value.toLowerCase());

      if (new Set(values).size !== values.length) {
        ctx.addIssue({ code: "custom", message: `${option.name} has the same value twice` });
      }
    }
  });

export function parseOptions(value: unknown): ProductOption[] {
  const parsed = productOptionsSchema.safeParse(value);
  return parsed.success ? parsed.data : [];
}

export function parseSelection(value: unknown): VariantSelection {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
  );
}

// "Brown / M", in option order
export const variantTitle = (options: ProductOption[], selection: VariantSelection) =>
  options.map((option) => selection[option.name]).filter(Boolean).join(" / ");

// Every combination of option values, e.g. 3 colors × 3 sizes = 9
export function combinations(options: ProductOption[]): VariantSelection[] {
  return options.reduce<VariantSelection[]>(
    (results, option) =>
      results.flatMap((selection) =>
        option.values.map((value) => ({ ...selection, [option.name]: value })),
      ),
    [{}],
  ).filter((selection) => Object.keys(selection).length > 0);
}

export const sameSelection = (a: VariantSelection, b: VariantSelection) =>
  Object.keys(a).length === Object.keys(b).length &&
  Object.entries(a).every(([key, value]) => b[key] === value);

export const findVariant = (variants: VariantView[], selection: VariantSelection) =>
  variants.find((variant) => sameSelection(variant.options, selection));

// Lowest and highest variant prices, for "From ₱..." labels
export function priceRange(variants: Pick<VariantView, "price">[]) {
  if (variants.length === 0) return null;

  const prices = variants.map((variant) => variant.price);

  return { min: Math.min(...prices), max: Math.max(...prices) };
}

// Admin save payload
export const variantsInputSchema = z
  .object({
    options: productOptionsSchema,
    variants: z
      .array(
        z.object({
          id: z.string().optional(),
          options: z.record(z.string(), z.string()),
          sku: z
            .string()
            .trim()
            .max(60)
            .transform((value) => value || null),
          price: z.coerce.number({ error: "Enter a price" }).positive("Price must be above ₱0"),
          stock: z.coerce.number().int("Stock must be a whole number").min(0, "Stock can't be negative"),
          image: z
            .string()
            .trim()
            .transform((value) => value || null),
        }),
      )
      .max(MAX_VARIANTS, `Up to ${MAX_VARIANTS} variants`),
  })
  .superRefine((input, ctx) => {
    if (input.options.length > 0 && input.variants.length === 0) {
      ctx.addIssue({ code: "custom", path: ["variants"], message: "Generate the variants before saving" });
    }

    const skus = input.variants.map((variant) => variant.sku).filter(Boolean);

    if (new Set(skus).size !== skus.length) {
      ctx.addIssue({ code: "custom", path: ["variants"], message: "Each SKU must be different" });
    }

    for (const [index, variant] of input.variants.entries()) {
      const complete = input.options.every((option) => option.values.includes(variant.options[option.name] ?? ""));

      if (!complete) {
        ctx.addIssue({
          code: "custom",
          path: ["variants", index],
          message: "A variant doesn't match the options. Generate the variants again.",
        });
      }
    }
  });

export type VariantsInput = z.input<typeof variantsInputSchema>;
