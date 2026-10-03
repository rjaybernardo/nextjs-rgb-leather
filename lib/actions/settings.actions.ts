"use server";

import { revalidatePath } from "next/cache";

import { recordAudit } from "@/lib/audit";
import { assertAdmin, requireAdmin } from "@/lib/auth-guard";
import { SERVER_URL } from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import {
  emailSettingsSchema,
  googleSettingsSchema,
  isSecretName,
  paymentSettingsSchema,
  SECRET_KEYS,
  type StoredIntegrationSettings,
} from "@/lib/integration-config";
import {
  getEmailSettings,
  getPaymentSettings,
  getSecretStatuses,
  getStoredIntegrationSettings,
  invalidateIntegrations,
} from "@/lib/integrations";
import { prisma } from "@/lib/prisma";
import { encryptSecret, secretHint } from "@/lib/secrets";
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

// ------------------------------------------------------------ integrations

type ActionResult = { success: boolean; message: string };

export async function getIntegrationsForAdmin() {
  await requireAdmin();

  const [secrets, payments, email, stored] = await Promise.all([
    getSecretStatuses(),
    getPaymentSettings(),
    getEmailSettings(),
    getStoredIntegrationSettings(),
  ]);

  return {
    secrets,
    payments,
    email,
    googleClientId: stored.googleClientId || process.env.AUTH_GOOGLE_ID || "",
    serverUrl: SERVER_URL,
  };
}

// Saves an API key, encrypted; the value is never logged or sent back
export async function saveSecret(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  try {
    const session = await assertAdmin();

    const name = String(formData.get("name") ?? "");
    const value = String(formData.get("value") ?? "").trim();

    if (!isSecretName(name)) {
      throw new Error("Unknown setting");
    }

    const key = SECRET_KEYS[name];

    if (!key.pattern.test(value)) {
      return { success: false, message: key.error };
    }

    await prisma.storeSecret.upsert({
      where: { name },
      create: { name, value: encryptSecret(name, value), hint: secretHint(value) },
      update: { value: encryptSecret(name, value), hint: secretHint(value) },
    });

    await recordAudit({
      actor: session,
      action: "settings.secret.update",
      entityType: "settings",
      entityId: name,
    });

    invalidateIntegrations();
    revalidatePath("/admin/settings");

    return { success: true, message: `${key.label} saved.` };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Removes a saved key; the environment variable (if any) is used again
export async function removeSecret(name: string): Promise<ActionResult> {
  try {
    const session = await assertAdmin();

    if (!isSecretName(name)) {
      throw new Error("Unknown setting");
    }

    await prisma.storeSecret.deleteMany({ where: { name } });

    await recordAudit({
      actor: session,
      action: "settings.secret.remove",
      entityType: "settings",
      entityId: name,
    });

    invalidateIntegrations();
    revalidatePath("/admin/settings");

    return { success: true, message: `${SECRET_KEYS[name].label} removed.` };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Merges one group of settings into the stored JSON
async function saveIntegrationSettings(
  changes: StoredIntegrationSettings,
  action: string,
  message: string,
): Promise<ActionResult> {
  const session = await assertAdmin();

  const before = await getStoredIntegrationSettings();
  const data = { ...before, ...changes };

  await prisma.integrationSettings.upsert({
    where: { id: 1 },
    create: { id: 1, data },
    update: { data },
  });

  await recordAudit({
    actor: session,
    action,
    entityType: "settings",
    details: { before: pick(before, Object.keys(changes)), after: changes },
  });

  invalidateIntegrations();
  revalidatePath("/admin/settings");

  return { success: true, message };
}

const pick = (source: Record<string, unknown>, keys: string[]) =>
  Object.fromEntries(keys.map((key) => [key, source[key] ?? null]));

export async function updatePaymentSettings(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  try {
    const data = paymentSettingsSchema.parse({
      paymentMethods: formData.getAll("paymentMethods"),
      defaultPaymentMethod: formData.get("defaultPaymentMethod"),
      paymongoMethods: formData.getAll("paymongoMethods"),
    });

    return await saveIntegrationSettings(data, "settings.payments.update", "Payment settings saved.");
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function updateEmailSettings(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  try {
    const data = emailSettingsSchema.parse({
      emailFrom: formData.get("emailFrom") ?? "",
      emailReplyTo: formData.get("emailReplyTo") ?? "",
    });

    return await saveIntegrationSettings(data, "settings.email.update", "Email settings saved.");
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

export async function updateGoogleSettings(_prevState: unknown, formData: FormData): Promise<ActionResult> {
  try {
    const data = googleSettingsSchema.parse({ googleClientId: formData.get("googleClientId") ?? "" });

    return await saveIntegrationSettings(data, "settings.google.update", "Google sign-in settings saved.");
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}

// Sends a test email to the signed-in admin, to check the Resend setup
export async function sendTestEmail(): Promise<ActionResult> {
  try {
    const session = await assertAdmin();
    const to = session.user?.email;

    if (!to) {
      throw new Error("Your account has no email address");
    }

    const result = await sendEmail({
      to,
      subject: "Test email from your store",
      text: "This is a test email from Admin → Settings. If you can read it, emails are set up correctly.",
      category: "admin_test",
    });

    return result.sent
      ? { success: true, message: `Test email sent to ${to}. Check your inbox (and spam).` }
      : { success: false, message: result.error };
  } catch (error) {
    return { success: false, message: formatError(error) };
  }
}
