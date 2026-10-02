import { formatCurrency } from "@/lib/utils";

type CouponLike = {
  type: "PERCENT" | "FIXED" | "FREE_SHIPPING";
  value: number;
  maxDiscount: number | null;
  minOrder: number;
  startsAt: Date | null;
  endsAt: Date | null;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
};

// "10% off (up to ₱500)", "₱200 off", "Free shipping"
export function describeDiscount(coupon: Pick<CouponLike, "type" | "value" | "maxDiscount">) {
  switch (coupon.type) {
    case "PERCENT":
      return `${coupon.value}% off${coupon.maxDiscount !== null ? ` (up to ${formatCurrency(coupon.maxDiscount)})` : ""}`;
    case "FIXED":
      return `${formatCurrency(coupon.value)} off`;
    case "FREE_SHIPPING":
      return "Free shipping";
  }
}

export type CouponStatus = "active" | "paused" | "scheduled" | "expired" | "used_up";

export function couponStatus(coupon: CouponLike, now = new Date()): CouponStatus {
  if (!coupon.active) return "paused";
  if (coupon.endsAt && coupon.endsAt <= now) return "expired";
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) return "used_up";
  if (coupon.startsAt && coupon.startsAt > now) return "scheduled";
  return "active";
}

export const STATUS_LABELS: Record<CouponStatus, string> = {
  active: "Active",
  paused: "Paused",
  scheduled: "Scheduled",
  expired: "Expired",
  used_up: "Used up",
};

// Date → datetime-local value in Philippine time, for form inputs
export const toManilaInput = (date: Date | null) =>
  date ? new Date(date.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16) : "";
