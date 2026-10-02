"use client";

import { Plus, Trash2, Wand2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { saveProductVariants } from "@/lib/actions/product.actions";
import {
  combinations,
  MAX_OPTIONS,
  MAX_VARIANTS,
  sameSelection,
  variantTitle,
  type ProductOption,
  type VariantSelection,
} from "@/lib/variant-utils";

type Row = {
  id?: string;
  options: VariantSelection;
  sku: string;
  price: string;
  stock: string;
  image: string;
};

type OptionDraft = { name: string; values: string };

type VariantsEditorProps = {
  productId: string;
  basePrice: number;
  images: string[];
  options: ProductOption[];
  variants: Row[];
};

const toDrafts = (options: ProductOption[]): OptionDraft[] =>
  options.map((option) => ({ name: option.name, values: option.values.join(", ") }));

const toOptions = (drafts: OptionDraft[]): ProductOption[] =>
  drafts
    .map((draft) => ({
      name: draft.name.trim(),
      values: draft.values
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean),
    }))
    .filter((option) => option.name && option.values.length > 0);

const imageLabel = (url: string, index: number) => `Photo ${index + 1}`;

export default function VariantsEditor({ productId, basePrice, images, options, variants }: VariantsEditorProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [drafts, setDrafts] = useState<OptionDraft[]>(toDrafts(options));
  const [rows, setRows] = useState<Row[]>(variants);
  const [appliedOptions, setAppliedOptions] = useState<ProductOption[]>(options);
  const [bulkPrice, setBulkPrice] = useState("");
  const [bulkStock, setBulkStock] = useState("");
  const [confirmRemoveAll, setConfirmRemoveAll] = useState(false);

  const updateDraft = (index: number, change: Partial<OptionDraft>) =>
    setDrafts((current) => current.map((draft, i) => (i === index ? { ...draft, ...change } : draft)));

  const updateRow = (index: number, change: Partial<Row>) =>
    setRows((current) => current.map((row, i) => (i === index ? { ...row, ...change } : row)));

  const optionsChanged = JSON.stringify(toOptions(drafts)) !== JSON.stringify(appliedOptions);

  function generate() {
    const next = toOptions(drafts);
    const combos = combinations(next);

    if (combos.length > MAX_VARIANTS) {
      toast.add({
        type: "error",
        description: `That makes ${combos.length} variants; the limit is ${MAX_VARIANTS}. Use fewer values.`,
      });
      return;
    }

    // Keep what was already filled in for combinations that still exist
    setRows(
      combos.map((selection) => {
        const existing = rows.find((row) => sameSelection(row.options, selection));

        return (
          existing ?? {
            options: selection,
            sku: "",
            price: String(basePrice),
            stock: "0",
            image: "",
          }
        );
      }),
    );
    setAppliedOptions(next);
  }

  function save(removeAll = false) {
    startTransition(async () => {
      const result = await saveProductVariants(
        productId,
        removeAll ? { options: [], variants: [] } : { options: appliedOptions, variants: rows },
      );

      toast.add({ type: result.success ? "success" : "error", description: result.message });

      if (result.success) {
        if (removeAll) {
          setDrafts([]);
          setRows([]);
          setAppliedOptions([]);
          setConfirmRemoveAll(false);
        }
        router.refresh();
      }
    });
  }

  return (
    <section className="space-y-6 rounded-lg border p-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">Variants</h2>
        <p className="text-sm text-muted-foreground">
          For products that come in options like color or size. Each combination gets its own
          stock and price. Leave empty for a simple product.
        </p>
      </div>

      <div className="space-y-3">
        {drafts.map((draft, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
            <div className="space-y-1">
              <Label htmlFor={`option-name-${index}`}>Option</Label>
              <Input
                id={`option-name-${index}`}
                value={draft.name}
                placeholder={index === 0 ? "Color" : index === 1 ? "Size" : "Finish"}
                maxLength={30}
                onChange={(event) => updateDraft(index, { name: event.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor={`option-values-${index}`}>Values, separated by commas</Label>
              <Input
                id={`option-values-${index}`}
                value={draft.values}
                placeholder={index === 0 ? "Black, Brown, Tan" : "S, M, L"}
                onChange={(event) => updateDraft(index, { values: event.target.value })}
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove option ${draft.name || index + 1}`}
              onClick={() => setDrafts((current) => current.filter((_, i) => i !== index))}
            >
              <Trash2 />
            </Button>
          </div>
        ))}

        <div className="flex flex-wrap gap-2">
          {drafts.length < MAX_OPTIONS && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDrafts((current) => [...current, { name: "", values: "" }])}
            >
              <Plus />
              Add option
            </Button>
          )}

          {drafts.length > 0 && (
            <Button type="button" size="sm" onClick={generate} disabled={toOptions(drafts).length === 0}>
              <Wand2 />
              {rows.length > 0 ? "Update variants" : "Generate variants"}
            </Button>
          )}
        </div>

        {optionsChanged && rows.length > 0 && (
          <p className="text-sm text-muted-foreground">
            Options changed. Click Update variants to apply them; filled-in rows are kept.
          </p>
        )}
      </div>

      {rows.length > 0 && (
        <>
          <div className="flex flex-wrap items-end gap-2 rounded-md bg-muted/50 p-3">
            <div className="space-y-1">
              <Label htmlFor="bulk-price">Set every price (₱)</Label>
              <Input id="bulk-price" type="number" min={0} step="0.01" value={bulkPrice} onChange={(event) => setBulkPrice(event.target.value)} className="w-32" />
            </div>
            <Button type="button" variant="outline" size="sm" disabled={!bulkPrice} onClick={() => setRows((current) => current.map((row) => ({ ...row, price: bulkPrice })))}>
              Apply
            </Button>

            <div className="space-y-1">
              <Label htmlFor="bulk-stock">Set every stock</Label>
              <Input id="bulk-stock" type="number" min={0} step="1" value={bulkStock} onChange={(event) => setBulkStock(event.target.value)} className="w-28" />
            </div>
            <Button type="button" variant="outline" size="sm" disabled={!bulkStock} onClick={() => setRows((current) => current.map((row) => ({ ...row, stock: bulkStock })))}>
              Apply
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Variant</th>
                  <th className="py-2 pr-3 font-medium">SKU</th>
                  <th className="py-2 pr-3 font-medium">Price (₱)</th>
                  <th className="py-2 pr-3 font-medium">Stock</th>
                  <th className="py-2 pr-3 font-medium">Photo</th>
                  <th className="py-2"><span className="sr-only">Remove</span></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => {
                  const title = variantTitle(appliedOptions, row.options);

                  return (
                    <tr key={title} className="border-b">
                      <td className="py-2 pr-3 font-medium whitespace-nowrap">{title}</td>
                      <td className="py-2 pr-3">
                        <Input aria-label={`SKU for ${title}`} value={row.sku} maxLength={60} className="w-32" onChange={(event) => updateRow(index, { sku: event.target.value })} />
                      </td>
                      <td className="py-2 pr-3">
                        <Input aria-label={`Price for ${title}`} type="number" min={0} step="0.01" value={row.price} className="w-28" onChange={(event) => updateRow(index, { price: event.target.value })} />
                      </td>
                      <td className="py-2 pr-3">
                        <Input aria-label={`Stock for ${title}`} type="number" min={0} step="1" value={row.stock} className="w-24" onChange={(event) => updateRow(index, { stock: event.target.value })} />
                      </td>
                      <td className="py-2 pr-3">
                        <select
                          aria-label={`Photo for ${title}`}
                          value={row.image}
                          onChange={(event) => updateRow(index, { image: event.target.value })}
                          className="h-9 rounded-md border border-input bg-transparent px-2 text-sm"
                        >
                          <option value="">Main photo</option>
                          {images.map((image, imageIndex) => (
                            <option key={image} value={image}>
                              {imageLabel(image, imageIndex)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="py-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${title}`}
                          onClick={() => setRows((current) => current.filter((_, i) => i !== index))}
                        >
                          <Trash2 />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-muted-foreground">
            Photos come from the product&apos;s images above, numbered in order. Removed rows
            aren&apos;t sold; past orders keep their details.
          </p>
        </>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" disabled={isPending || optionsChanged || (drafts.length > 0 && rows.length === 0)} onClick={() => save()}>
          {isPending ? "Saving..." : "Save variants"}
        </Button>

        {(options.length > 0 || rows.length > 0) && (
          <div className="ml-auto">
            {confirmRemoveAll ? (
              <span className="flex gap-2">
                <Button type="button" variant="destructive" disabled={isPending} onClick={() => save(true)}>
                  Yes, remove all variants
                </Button>
                <Button type="button" variant="ghost" onClick={() => setConfirmRemoveAll(false)}>
                  Keep
                </Button>
              </span>
            ) : (
              <Button type="button" variant="ghost" onClick={() => setConfirmRemoveAll(true)}>
                Remove all variants
              </Button>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
