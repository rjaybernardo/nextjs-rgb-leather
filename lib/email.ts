import "server-only";

import * as Sentry from "@sentry/nextjs";
import { Resend } from "resend";

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

let client: Resend | null = null;

const getResend = () => {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) return null;

  client ??= new Resend(apiKey);

  return client;
};

/*
 * Sends through Resend when RESEND_API_KEY is set; otherwise prints the
 * email to the server log (handy in development).
 *
 * EMAIL_FROM must use a domain verified in Resend, e.g.
 * "Your Store <orders@yourdomain.ph>". Resend's test sender
 * (onboarding@resend.dev) only delivers to your own Resend account email.
 *
 * Never throws: a failed email must not fail the order or sign-up, so
 * failures are logged and reported to Sentry instead.
 */
export async function sendEmail(email: Email) {
  const resend = getResend();

  if (!resend) {
    console.info(
      [
        "─── Email (logged, not sent: RESEND_API_KEY is not set) ───",
        `To: ${email.to}`,
        `Subject: ${email.subject}`,
        "",
        email.text,
        "────────────────────────────────",
      ].join("\n"),
    );
    return;
  }

  try {
    const { error } = await resend.emails.send(
      {
        from:
          process.env.EMAIL_FROM ||
          `${(await getSiteSettings()).siteName} <onboarding@resend.dev>`,
        to: email.to,
        subject: email.subject,
        text: email.text,
        ...(email.html ? { html: email.html } : {}),
        ...(process.env.EMAIL_REPLY_TO
          ? { replyTo: process.env.EMAIL_REPLY_TO }
          : {}),
        tags: [{ name: "category", value: email.category }],
      },
      email.idempotencyKey
        ? { idempotencyKey: email.idempotencyKey }
        : undefined,
    );

    if (error) {
      throw new Error(`Resend: ${error.message}`);
    }
  } catch (error) {
    console.error(`Failed to send "${email.category}" email`, error);

    Sentry.captureException(error, {
      tags: { provider: "resend", category: email.category },
    });
  }
}
