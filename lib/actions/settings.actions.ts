"use server";

import { revalidatePath } from "next/cache";

import { recordAudit } from "@/lib/audit";
import { assertAdmin, requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";
import { getShippingSettings } from "@/lib/store-settings";
import { round2 } from "@/lib/utils";
import { formatError } from "@/lib/utils/server";
import { shippingSettingsSchema } from "@/lib/validators";

export async function getShippingSettingsForAdmin() {
  await requireAdmin();

  return getShippingSettings();
}

export async function updateShippingSettings(
  _prevState: unknown,
  formData: FormData,
) {
  try {
    const session = await assertAdmin();

    const data = shippingSettingsSchema.parse({
      shippingFee: formData.get("shippingFee"),
      freeShippingMin: formData.get("freeShippingMin"),
    });

    const values = {
      shippingFee: round2(data.shippingFee),
      freeShippingMin: round2(data.freeShippingMin),
    };

    const before = await getShippingSettings();

    await prisma.storeSettings.upsert({
      where: {
        id: 1,
      },
      create: {
        id: 1,
        ...values,
      },
      update: values,
    });

    await recordAudit({
      actor: session,
      action: "settings.shipping.update",
      entityType: "settings",
      details: {
        before,
        after: values,
      },
    });

    revalidatePath("/admin/settings");

    return {
      success: true,
      message:
        "Shipping settings saved. Carts are re-priced at checkout, so customers see the new rates before paying.",
    };
  } catch (error) {
    return {
      success: false,
      message: formatError(error),
    };
  }
}
