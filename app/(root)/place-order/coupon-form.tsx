"use client";

import { Tag, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { applyCoupon, removeCoupon } from "@/lib/actions/cart.actions";

type CouponFormProps = {
  appliedCode: string | null;
};

// "Have a discount code?" on the place-order page
export default function CouponForm({ appliedCode }: CouponFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  if (appliedCode) {
    return (
      <div className="flex items-center justify-between gap-2 rounded-md border border-dashed px-3 py-2 text-sm">
        <span className="flex items-center gap-2 font-medium">
          <Tag className="size-4 text-primary" aria-hidden="true" />
          {appliedCode}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await removeCoupon();
              toast.add({ type: result.success ? "success" : "error", description: result.message });
              router.refresh();
            })
          }
        >
          <X />
          Remove
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-1"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");

        startTransition(async () => {
          const result = await applyCoupon(code);

          if (!result.success) {
            setError(result.message);
            return;
          }

          toast.add({ type: "success", description: result.message });
          setCode("");
          router.refresh();
        });
      }}
    >
      <label htmlFor="coupon-code" className="text-sm font-medium">
        Have a discount code?
      </label>

      <div className="flex gap-2">
        <Input
          id="coupon-code"
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder="e.g. WELCOME10"
          autoComplete="off"
          maxLength={40}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "coupon-error" : undefined}
          className="uppercase"
        />

        <Button type="submit" variant="outline" disabled={isPending || code.trim().length === 0}>
          {isPending ? "Checking..." : "Apply"}
        </Button>
      </div>

      {error && (
        <p id="coupon-error" role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </form>
  );
}
