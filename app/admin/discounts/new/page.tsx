import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/auth-guard";

import CouponForm, { EMPTY_COUPON } from "../coupon-form";

export const metadata: Metadata = {
  title: "New discount code",
};

export default async function NewDiscountPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Link href="/admin/discounts" className="text-sm text-muted-foreground hover:underline">
          ← All discount codes
        </Link>
        <h1 className="h2-bold">New discount code</h1>
      </div>

      <CouponForm initial={EMPTY_COUPON} />
    </div>
  );
}
