import "server-only";

import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";

import { getEmailSettings, getSecret } from "@/lib/integrations";
import { getSiteSettings } from "@/lib/site";

export type Email = {
  to: string;
  subject: string;
  // Plain-text version, always sent; html is the branded version
  text: string;
  html?: string;
  // Groups emails in Resend's dashboard, e.g. "order_placed"
  category: string;
  // Stops the same email going out twice for one event (Resend keeps keys 24h)
  idempotencyKey?: string;
};

export type SendResult = { sent: true } | { sent: false; error: string };

// One client per key, so a key changed in admin takes effect immediately
let client: { apiKey: string; resend: Resend } | null = null;

const getResend = async () => {
  const apiKey = await getSecret("RESEND_API_KEY");

  if (!apiKey) return null;

  if (client?.apiKey !== apiKey) {
    client = { apiKey, resend: new Resend(apiKey) };
  }

  return client.resend;
};

/*
 * Sends through Resend when an API key is set (Admin → Settings, or
 * RESEND_API_KEY); otherwise prints the email to the server log (handy in
 * development).
 *
 * The sender (Admin → Settings, or EMAIL_FROM) must use a domain verified
 * in Resend, e.g.
 * "Your Store <orders@yourdomain.ph>". Resend's test sender
 * (onboarding@resend.dev) only delivers to your own Resend account email.
 *
 * Never throws: a failed email must not fail the order or sign-up, so
 * failures are logged and reported to Sentry instead. The result is only
 * for callers that want to show it, like the admin's test email.
 */
export async function sendEmail(email: Email): Promise<SendResult> {
  let resend: Resend | null;
  let settings: Awaited<ReturnType<typeof getEmailSettings>>;

  try {
    [resend, settings] = await Promise.all([getResend(), getEmailSettings()]);
  } catch (error) {
    console.error(`Failed to load email settings for "${email.category}" email`, error);
    Sentry.captureException(error, { tags: { provider: "resend", category: email.category } });

    return { sent: false, error: "Email settings could not be loaded" };
  }

  if (!resend) {
    console.info(
      [
        "─── Email (logged, not sent: no Resend API key is set) ───",
        `To: ${email.to}`,
        `Subject: ${email.subject}`,
        "",
        email.text,
        "────────────────────────────────",
      ].join("\n"),
    );
    return { sent: false, error: "No Resend API key is set, so the email was only written to the server log." };
  }

  try {
    const { error } = await resend.emails.send(
      {
        from: settings.from || `${(await getSiteSettings()).siteName} <onboarding@resend.dev>`,
        to: email.to,
        subject: email.subject,
        text: email.text,
        ...(email.html ? { html: email.html } : {}),
        ...(settings.replyTo ? { replyTo: settings.replyTo } : {}),
        tags: [{ name: "category", value: email.category }],
      },
      email.idempotencyKey
        ? { idempotencyKey: email.idempotencyKey }
        : undefined,
    );

    if (error) {
      throw new Error(`Resend: ${error.message}`);
    }

    return { sent: true };
  } catch (error) {
    console.error(`Failed to send "${email.category}" email`, error);

    Sentry.captureException(error, {
      tags: { provider: "resend", category: email.category },
    });

    return { sent: false, error: error instanceof Error ? error.message : "The email could not be sent" };
  }
}
