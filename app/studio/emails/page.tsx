import type { Metadata } from "next";
import Link from "next/link";

import { requireAdmin } from "@/lib/auth-guard";
import { EMAIL_PREVIEWS, isEmailPreviewKey, type EmailPreviewKey } from "@/lib/email-previews";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Emails",
};

export default async function StudioEmailsPage(props: {
  searchParams: Promise<{ email?: string }>;
}) {
  await requireAdmin();

  const { email } = await props.searchParams;
  const selected: EmailPreviewKey = isEmailPreviewKey(email) ? email : "order_placed_online";

  const preview = await EMAIL_PREVIEWS[selected].build();

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="h2-bold">Emails</h1>
        <p className="text-muted-foreground">
          What customers receive, with sample orders. They use your logo, name and brand color
          from Branding and Theme, and your contact details in the footer.
        </p>
      </div>

      <nav aria-label="Email templates" className="flex flex-wrap gap-2">
        {(Object.keys(EMAIL_PREVIEWS) as EmailPreviewKey[]).map((key) => (
          <Link
            key={key}
            href={`/studio/emails?email=${key}`}
            aria-current={key === selected ? "page" : undefined}
            className={cn(
              "rounded-full border px-3 py-1 text-sm",
              key === selected ? "border-primary bg-primary text-primary-foreground" : "hover:bg-muted",
            )}
          >
            {EMAIL_PREVIEWS[key].label}
          </Link>
        ))}
      </nav>

      <div className="space-y-1 rounded-lg border p-4 text-sm">
        <p>
          <span className="text-muted-foreground">Subject:</span> {preview.subject}
        </p>
        <p>
          <span className="text-muted-foreground">To:</span> {preview.to}
        </p>
      </div>

      {/* Sandboxed: email HTML can't run scripts or reach this page */}
      <iframe
        title={`${EMAIL_PREVIEWS[selected].label} email preview`}
        srcDoc={preview.html}
        sandbox=""
        className="h-[760px] w-full rounded-lg border bg-white"
      />

      <details className="rounded-lg border p-4">
        <summary className="cursor-pointer text-sm font-medium">Plain-text version</summary>
        <pre className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{preview.text}</pre>
      </details>
    </div>
  );
}
