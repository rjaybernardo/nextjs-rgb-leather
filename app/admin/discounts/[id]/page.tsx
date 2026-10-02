import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getCoupon } from "@/lib/actions/coupon.actions";
import { toManilaInput } from "@/lib/coupon-format";

import CouponForm from "../coupon-form";

export const metadata: Metadata = {
  title: "Edit discount code",
};

export default async function EditDiscountPage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const coupon = await getCoupon(id);

  if (!coupon) notFound();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link href="/admin/discounts" className="text-sm text-muted-foreground hover:underline">
          ← All discount codes
        </Link>
        <h1 className="h2-bold font-mono">{coupon.code}</h1>
      </div>

      <CouponForm
        id={coupon.id}
        usedCount={coupon.usedCount}
        initial={{
          code: coupon.code,
          description: coupon.description,
          type: coupon.type,
          value: String(coupon.value),
          maxDiscount: coupon.maxDiscount === null ? "" : String(coupon.maxDiscount),
          minOrder: String(coupon.minOrder),
          startsAt: toManilaInput(coupon.startsAt),
          endsAt: toManilaInput(coupon.endsAt),
          usageLimit: coupon.usageLimit === null ? "" : String(coupon.usageLimit),
          perCustomerLimit: coupon.perCustomerLimit === null ? "" : String(coupon.perCustomerLimit),
          active: coupon.active,
        }}
      />
    </div>
  );
}
