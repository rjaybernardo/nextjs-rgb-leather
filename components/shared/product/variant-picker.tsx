"use client";

import { useEffect, useMemo, useState } from "react";

import AddToCart from "@/components/shared/product/add-to-cart";
import ProductPrice from "@/components/shared/product/product-price";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  findVariant,
  type ProductOption,
  type VariantSelection,
  type VariantView,
} from "@/lib/variant-utils";
import type { Cart } from "@/types";

export const VARIANT_IMAGE_EVENT = "product:variant-image";

type VariantPickerProps = {
  product: { id: string; name: string; slug: string; images: string[] };
  options: ProductOption[];
  variants: VariantView[];
  cart?: Cart;
  lowStockThreshold: number;
};

// Option buttons for products with variants; price, stock and add to cart
// follow the chosen combination
export default function VariantPicker({
  product,
  options,
  variants,
  cart,
  lowStockThreshold,
}: VariantPickerProps) {
  // Start on the first variant that's in stock
  const initial = variants.find((variant) => variant.stock > 0) ?? variants[0];
  const [selection, setSelection] = useState<VariantSelection>(initial?.options ?? {});

  const selected = findVariant(variants, selection);

  useEffect(() => {
    if (selected?.image) {
      window.dispatchEvent(new CustomEvent(VARIANT_IMAGE_EVENT, { detail: selected.image }));
    }
  }, [selected?.image]);

  // For each option value: does a variant exist with it (keeping the other
  // choices), and is that variant in stock?
  const availability = useMemo(() => {
    const result: Record<string, Record<string, "available" | "sold_out" | "none">> = {};

    for (const option of options) {
      result[option.name] = {};

      for (const value of option.values) {
        const match = findVariant(variants, { ...selection, [option.name]: value });
        result[option.name][value] = !match ? "none" : match.stock > 0 ? "available" : "sold_out";
      }
    }

    return result;
  }, [options, variants, selection]);

  const choose = (name: string, value: string) => {
    const next = { ...selection, [name]: value };

    // If that combination doesn't exist, jump to one that has this value
    if (!findVariant(variants, next)) {
      const fallback =
        variants.find((variant) => variant.options[name] === value && variant.stock > 0) ??
        variants.find((variant) => variant.options[name] === value);

      if (fallback) {
        setSelection(fallback.options);
        return;
      }
    }

    setSelection(next);
  };

  return (
    <div className="space-y-4">
      {options.map((option) => (
        <fieldset key={option.name} className="space-y-2">
          <legend className="text-sm font-medium">
            {option.name}:{" "}
            <span className="font-normal text-muted-foreground">{selection[option.name]}</span>
          </legend>

          <div className="flex flex-wrap gap-2">
            {option.values.map((value) => {
              const state = availability[option.name][value];
              const active = selection[option.name] === value;

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => choose(option.name, value)}
                  disabled={state === "none" && !variants.some((variant) => variant.options[option.name] === value)}
                  aria-pressed={active}
                  aria-label={`${option.name}: ${value}${state === "sold_out" ? " (sold out)" : ""}`}
                  className={cn(
                    "min-w-11 rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-40",
                    active ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
                    state === "sold_out" && !active && "text-muted-foreground line-through",
                  )}
                >
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}

      <div className="flex items-center justify-between">
        <div>Price</div>
        {selected ? <ProductPrice value={selected.price} /> : <span className="text-sm">—</span>}
      </div>

      <div className="flex items-center justify-between">
        <div>Status</div>

        {!selected ? (
          <Badge variant="outline">Not available</Badge>
        ) : selected.stock <= 0 ? (
          <Badge variant="destructive">Out of stock</Badge>
        ) : selected.stock <= lowStockThreshold ? (
          <Badge variant="secondary">Only {selected.stock} left</Badge>
        ) : (
          <Badge variant="outline">In stock</Badge>
        )}
      </div>

      {selected && selected.stock > 0 && (
        <div className="flex">
          <AddToCart
            // Reset quantity controls when switching variants
            key={selected.id}
            cart={cart}
            stock={selected.stock}
            item={{
              productId: product.id,
              name: product.name,
              slug: product.slug,
              price: selected.price,
              qty: 1,
              image: selected.image || product.images[0],
              variantId: selected.id,
              variantTitle: selected.title,
            }}
          />
        </div>
      )}
    </div>
  );
}
