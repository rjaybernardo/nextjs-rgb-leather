import "server-only";

export type Email = {
  to: string;
  subject: string;
  text: string;
};

/*
 * No email provider is configured yet, so emails are printed to the server
 * log. Swap the body for a provider call (e.g. Resend) when you pick one.
 * Never throws: a failed email must not fail the order or sign-up.
 */
export async function sendEmail({ to, subject, text }: Email) {
  try {
    console.info(
      [
        "─── Email (logged, not sent) ───",
        `To: ${to}`,
        `Subject: ${subject}`,
        "",
        text,
        "────────────────────────────────",
      ].join("\n"),
    );
  } catch (error) {
    console.error("Failed to send email", error);
  }
}
