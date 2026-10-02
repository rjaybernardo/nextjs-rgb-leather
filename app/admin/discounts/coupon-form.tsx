"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import {
  createCoupon,
  deleteCoupon,
  setCouponActive,
  updateCoupon,
  type CouponInput,
} from "@/lib/actions/coupon.actions";
import { describeDiscount } from "@/lib/coupon-format";
import { formatCurrency } from "@/lib/utils";

export type CouponFormValues = {
  code: string;
  description: string;
  type: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  value: string;
  maxDiscount: string;
  minOrder: string;
  startsAt: string;
  endsAt: string;
  usageLimit: string;
  perCustomerLimit: string;
  active: boolean;
};

export const EMPTY_COUPON: CouponFormValues = {
  code: "",
  description: "",
  type: "PERCENT",
  value: "10",
  maxDiscount: "",
  minOrder: "0",
  startsAt: "",
  endsAt: "",
  usageLimit: "",
  perCustomerLimit: "1",
  active: true,
};

const selectClass = "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm";

type CouponFormProps = {
  id?: string;
  initial: CouponFormValues;
  usedCount?: number;
};

export default function CouponForm({ id, initial, usedCount = 0 }: CouponFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [values, setValues] = useState(initial);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const set = <K extends keyof CouponFormValues>(key: K, value: CouponFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const input: CouponInput = { ...values };

  const preview = describeDiscount({
    type: values.type,
    value: Number(values.value) || 0,
    maxDiscount: values.maxDiscount ? Number(values.maxDiscount) : null,
  });

  const minOrder = Number(values.minOrder) || 0;

  function run(action: () => Promise<{ success: boolean; message: string; id?: string }>, after?: (id?: string) => void) {
    startTransition(async () => {
      const result = await action();

      toast.add({ type: result.success ? "success" : "error", description: result.message });

      if (result.success) after?.(result.id);
    });
  }

  return (
    <form
      className="max-w-2xl space-y-6"
      onSubmit={(event) => {
        event.preventDefault();

        if (id) {
          run(() => updateCoupon(id, input), () => router.refresh());
        } else {
          run(() => createCoupon(input), () => router.push("/admin/discounts"));
        }
      }}
    >
      <div className="rounded-lg border bg-muted/40 p-4 text-sm">
        Customers get <strong>{preview}</strong>
        {minOrder > 0 && <> on orders of {formatCurrency(minOrder)} or more</>}
        {values.code && (
          <>
            {" "}with <span className="font-mono font-semibold">{values.code.toUpperCase()}</span>
          </>
        )}
        .
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor="coupon-code-input">Code</Label>
          <Input
            id="coupon-code-input"
            value={values.code}
            onChange={(event) => set("code", event.target.value.toUpperCase().replace(/\s+/g, ""))}
            placeholder="WELCOME10"
            maxLength={30}
            className="font-mono uppercase"
            required
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="coupon-description">Note (only admins see this)</Label>
          <Input
            id="coupon-description"
            value={values.description}
            onChange={(event) => set("description", event.target.value)}
            placeholder="e.g. Facebook launch promo"
            maxLength={200}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="coupon-type">Discount type</Label>
          <select
            id="coupon-type"
            value={values.type}
            onChange={(event) => set("type", event.target.value as CouponFormValues["type"])}
            className={selectClass}
          >
            <option value="PERCENT">Percent off</option>
            <option value="FIXED">Fixed amount off (₱)</option>
            <option value="FREE_SHIPPING">Free shipping</option>
          </select>
        </div>

        {values.type !== "FREE_SHIPPING" && (
          <div className="space-y-1">
            <Label htmlFor="coupon-value">{values.type === "PERCENT" ? "Percent off" : "Amount off (₱)"}</Label>
            <Input
              id="coupon-value"
              type="number"
              inputMode="decimal"
              min={values.type === "PERCENT" ? 1 : 0.01}
              max={values.type === "PERCENT" ? 100 : undefined}
              step={values.type === "PERCENT" ? 1 : 0.01}
              value={values.value}
              onChange={(event) => set("value", event.target.value)}
              required
            />
          </div>
        )}

        {values.type === "PERCENT" && (
          <div className="space-y-1">
            <Label htmlFor="coupon-max">Maximum discount (₱, optional)</Label>
            <Input
              id="coupon-max"
              type="number"
              inputMode="decimal"
              min={0}
              step={0.01}
              value={values.maxDiscount}
              onChange={(event) => set("maxDiscount", event.target.value)}
              placeholder="No cap"
            />
          </div>
        )}

        <div className="space-y-1">
          <Label htmlFor="coupon-min">Minimum order (₱)</Label>
          <Input
            id="coupon-min"
            type="number"
            inputMode="decimal"
            min={0}
            step={0.01}
            value={values.minOrder}
            onChange={(event) => set("minOrder", event.target.value)}
          />
          <p className="text-xs text-muted-foreground">Items total before shipping. 0 for none.</p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="coupon-starts">Starts (optional)</Label>
          <Input
            id="coupon-starts"
            type="datetime-local"
            value={values.startsAt}
            onChange={(event) => set("startsAt", event.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="coupon-ends">Ends (optional)</Label>
          <Input
            id="coupon-ends"
            type="datetime-local"
            value={values.endsAt}
            onChange={(event) => set("endsAt", event.target.value)}
          />
          <p className="text-xs text-muted-foreground">Philippine time.</p>
        </div>

        <div className="space-y-1">
          <Label htmlFor="coupon-limit">Total uses (optional)</Label>
          <Input
            id="coupon-limit"
            type="number"
            min={1}
            step={1}
            value={values.usageLimit}
            onChange={(event) => set("usageLimit", event.target.value)}
            placeholder="Unlimited"
          />
          {id && <p className="text-xs text-muted-foreground">Used {usedCount} times so far.</p>}
        </div>

        <div className="space-y-1">
          <Label htmlFor="coupon-per-customer">Uses per customer (optional)</Label>
          <Input
            id="coupon-per-customer"
            type="number"
            min={1}
            step={1}
            value={values.perCustomerLimit}
            onChange={(event) => set("perCustomerLimit", event.target.value)}
            placeholder="Unlimited"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={values.active}
          onChange={(event) => set("active", event.target.checked)}
          className="size-4 accent-primary"
        />
        Active (customers can use it)
      </label>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving..." : id ? "Save code" : "Create code"}
        </Button>

        {id && (
          <Button
            type="button"
            variant="outline"
            disabled={isPending}
            onClick={() =>
              run(() => setCouponActive(id, !values.active), () => {
                set("active", !values.active);
                router.refresh();
              })
            }
          >
            {values.active ? "Pause" : "Resume"}
          </Button>
        )}

        {id && (
          <div className="ml-auto">
            {confirmDelete ? (
              <span className="flex gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isPending}
                  onClick={() => run(() => deleteCoupon(id), () => router.push("/admin/discounts"))}
                >
                  Yes, delete
                </Button>
                <Button type="button" variant="ghost" onClick={() => setConfirmDelete(false)}>
                  Keep
                </Button>
              </span>
            ) : (
              <Button type="button" variant="ghost" onClick={() => setConfirmDelete(true)}>
                Delete
              </Button>
            )}
          </div>
        )}
      </div>
    </form>
  );
}
