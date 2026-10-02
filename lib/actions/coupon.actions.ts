"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { recordAudit } from "@/lib/audit";
import { assertAdmin, requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { formatError } from "@/lib/utils/server";
import { couponSchema } from "@/lib/validators";

type Result = { success: boolean; message: string; id?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type CouponInput = z.input<typeof couponSchema>;

// Stored values for the database; FREE_SHIPPING has no amount or cap
const toData = (input: CouponInput) => {
  const data = couponSchema.parse(input);

  return {
    ...data,
    value: data.type === "FREE_SHIPPING" ? 0 : data.value,
    maxDiscount: data.type === "PERCENT" ? data.maxDiscount : null,
  };
};

const toView = (coupon: Awaited<ReturnType<typeof prisma.coupon.findFirstOrThrow>>) => ({
  ...coupon,
  value: Number(coupon.value),
  maxDiscount: coupon.maxDiscount === null ? null : Number(coupon.maxDiscount),
  minOrder: Number(coupon.minOrder),
});

export async function getCoupons() {
  await requireAdmin();

  const coupons = await prisma.coupon.findMany({
    orderBy: [{ active: "desc" }, { createdAt: "desc" }],
  });

  return coupons.map(toView);
}

export async function getCoupon(id: string) {
  await requireAdmin();

  if (!UUID.test(id)) return null;

  const coupon = await prisma.coupon.findUnique({ where: { id } });

  return coupon ? toView(coupon) : null;
}

const codeTaken = async (code: string, exceptId?: string) =>
  Boolean(
    await prisma.coupon.findFirst({
      where: { code, ...(exceptId ? { NOT: { id: exceptId } } : {}) },
      select: { id: true },
    }),
  );

export async function createCoupon(input: CouponInput): Promise<Result> {
  try {
    const session = await assertAdmin();
    const data = toData(input);

    if (await codeTaken(data.code)) {
      throw new Error(`${data.code} already exists`);
    }

    const coupon = await prisma.coupon.create({ data });

    await recordAudit({
      actor: session,
      action: "coupon.create",
      entityType: "coupon",
      entityId: coupon.id,
      details: { code: coupon.code, type: coupon.type, value: Number(coupon.value) },
    });

    revalidatePath("/admin/discounts");

    return { success: true, message: `${coupon.code} created`, id: coupon.id };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function updateCoupon(id: string, input: CouponInput): Promise<Result> {
  try {
    const session = await assertAdmin();
    const data = toData(input);

    if (await codeTaken(data.code, id)) {
      throw new Error(`${data.code} already exists`);
    }

    const before = await prisma.coupon.findUnique({ where: { id } });

    if (!before) {
      throw new Error("Discount code not found");
    }

    await prisma.coupon.update({ where: { id }, data });

    await recordAudit({
      actor: session,
      action: "coupon.update",
      entityType: "coupon",
      entityId: id,
      details: {
        code: data.code,
        ...(before.code !== data.code ? { renamed: { before: before.code, after: data.code } } : {}),
        ...(before.active !== data.active ? { active: { before: before.active, after: data.active } } : {}),
      },
    });

    revalidatePath("/admin/discounts");

    return { success: true, message: `${data.code} saved` };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function setCouponActive(id: string, active: boolean): Promise<Result> {
  try {
    const session = await assertAdmin();

    const coupon = await prisma.coupon.update({
      where: { id },
      data: { active },
      select: { code: true },
    });

    await recordAudit({
      actor: session,
      action: active ? "coupon.resume" : "coupon.pause",
      entityType: "coupon",
      entityId: id,
      details: { code: coupon.code },
    });

    revalidatePath("/admin/discounts");

    return { success: true, message: active ? `${coupon.code} is active` : `${coupon.code} is paused` };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function deleteCoupon(id: string): Promise<Result> {
  try {
    const session = await assertAdmin();

    const coupon = await prisma.coupon.findUnique({
      where: { id },
      include: { _count: { select: { redemptions: true } } },
    });

    if (!coupon) {
      throw new Error("Discount code not found");
    }

    // Orders keep a record of the code they used; pause it instead
    if (coupon._count.redemptions > 0) {
      throw new Error(`${coupon.code} has been used on orders. Pause it instead of deleting.`);
    }

    await prisma.coupon.delete({ where: { id } });

    await recordAudit({
      actor: session,
      action: "coupon.delete",
      entityType: "coupon",
      entityId: id,
      details: { code: coupon.code },
    });

    revalidatePath("/admin/discounts");

    return { success: true, message: `${coupon.code} deleted` };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
