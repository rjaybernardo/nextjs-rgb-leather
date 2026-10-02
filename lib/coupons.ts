import "server-only";

import type { Coupon, Prisma } from "@/lib/generated/prisma/client";
import type { DiscountRule } from "@/lib/cart-pricing";
import { prisma } from "@/lib/prisma";
import { formatCurrency } from "@/lib/utils";

export const normalizeCouponCode = (code: string) =>
  code.trim().toUpperCase().replace(/\s+/g, "");

export const toDiscountRule = (coupon: Pick<Coupon, "type" | "value" | "maxDiscount">): DiscountRule => ({
  type: coupon.type,
  value: Number(coupon.value),
  maxDiscount: coupon.maxDiscount === null ? null : Number(coupon.maxDiscount),
});

type CheckResult =
  | { ok: true; coupon: Coupon; rule: DiscountRule }
  | { ok: false; message: string };

/*
 * Whether a customer can use a code on a cart worth itemsPrice right now.
 * Usage limits are checked again (with a row lock) when the order is placed.
 */
export async function checkCoupon(
  rawCode: string,
  { userId, itemsPrice }: { userId: string; itemsPrice: number },
  db: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<CheckResult> {
  const code = normalizeCouponCode(rawCode);

  if (!code) {
    return { ok: false, message: "Enter a discount code" };
  }

  const coupon = await db.coupon.findUnique({ where: { code } });
  const now = new Date();

  if (!coupon || !coupon.active) {
    return { ok: false, message: `${code} isn't a valid discount code` };
  }

  if (coupon.startsAt && coupon.startsAt > now) {
    return { ok: false, message: `${code} isn't active yet` };
  }

  if (coupon.endsAt && coupon.endsAt <= now) {
    return { ok: false, message: `${code} has expired` };
  }

  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    return { ok: false, message: `${code} has been fully used` };
  }

  if (itemsPrice < Number(coupon.minOrder)) {
    return {
      ok: false,
      message: `${code} needs a minimum order of ${formatCurrency(Number(coupon.minOrder))}`,
    };
  }

  if (coupon.perCustomerLimit !== null) {
    const used = await db.couponRedemption.count({
      where: { couponId: coupon.id, userId },
    });

    if (used >= coupon.perCustomerLimit) {
      return {
        ok: false,
        message:
          coupon.perCustomerLimit === 1
            ? `You've already used ${code}`
            : `You've used ${code} the maximum ${coupon.perCustomerLimit} times`,
      };
    }
  }

  return { ok: true, coupon, rule: toDiscountRule(coupon) };
}

/*
 * Claims one use of a coupon inside the order transaction. The conditional
 * UPDATE locks the coupon row, so concurrent orders can't go over the limit,
 * and the per-customer count read after it is consistent.
 */
export async function redeemCoupon(
  tx: Prisma.TransactionClient,
  { couponId, orderId, userId, amount, perCustomerLimit }: {
    couponId: string;
    orderId: string;
    userId: string;
    amount: number;
    perCustomerLimit: number | null;
  },
) {
  const claimed = await tx.$queryRaw<{ id: string }[]>`
    UPDATE "Coupon"
    SET "usedCount" = "usedCount" + 1, "updatedAt" = now()
    WHERE "id" = ${couponId}::uuid
      AND "active"
      AND ("usageLimit" IS NULL OR "usedCount" < "usageLimit")
    RETURNING "id"
  `;

  if (claimed.length === 0) {
    throw new Error("That discount code has just been fully used. Remove it to continue.");
  }

  if (perCustomerLimit !== null) {
    const used = await tx.couponRedemption.count({ where: { couponId, userId } });

    if (used >= perCustomerLimit) {
      throw new Error("You've already used that discount code. Remove it to continue.");
    }
  }

  await tx.couponRedemption.create({
    data: { couponId, orderId, userId, amount },
  });
}

// Gives a use back when an order is cancelled or deleted
export async function releaseCoupon(tx: Prisma.TransactionClient, orderId: string) {
  const redemption = await tx.couponRedemption.findUnique({ where: { orderId } });

  if (!redemption) return;

  await tx.couponRedemption.delete({ where: { id: redemption.id } });
  await tx.coupon.update({
    where: { id: redemption.couponId },
    data: { usedCount: { decrement: 1 } },
  });
}
