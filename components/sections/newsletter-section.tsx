"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import AccentText from "@/components/shared/accent-text";
import { subscribeNewsletter } from "@/lib/actions/studio.actions";
import type { SectionData } from "@/lib/site-config";
import { cn } from "@/lib/utils";

import { Section, pillButton } from "./section-shell";

const initialState = { success: false, message: "" };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending} className={pillButton.light}>
      {pending ? "Subscribing..." : label}
    </button>
  );
}

const NewsletterSection = ({ data }: { data: SectionData<"newsletter"> }) => {
  const [state, action] = useActionState(subscribeNewsletter, initialState);

  return (
    <Section>
      <div className="tone-brand rounded-[calc(var(--radius)*2)] bg-[var(--brand)] px-[clamp(20px,5vw,64px)] py-[clamp(40px,6vw,80px)] text-center text-[var(--brand-foreground)]">
        <div className="mx-auto flex max-w-xl flex-col gap-5">
          <h2 className="h-section text-[clamp(1.75rem,3.4vw,2.75rem)]">
            <AccentText text={data.title} />
          </h2>
          {data.text && <p className="text-[var(--tone-muted)]">{data.text}</p>}

          {state.success ? (
            <p role="status" className="font-medium">
              {state.message}
            </p>
          ) : (
            <form action={action} className="flex flex-col gap-2 sm:flex-row">
              <label htmlFor="newsletter-email" className="sr-only">
                Email address
              </label>

              <input
                id="newsletter-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className="min-h-[52px] min-w-0 flex-1 rounded-full border-[1.5px] border-[var(--tone-line)] bg-transparent px-[22px] text-[15px] placeholder:text-[var(--tone-muted)] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-ring"
              />

              <SubmitButton label={data.buttonText} />
            </form>
          )}

          {!state.success && state.message && (
            <p role="status" className={cn("text-sm font-medium")}>
              {state.message}
            </p>
          )}
        </div>
      </div>
    </Section>
  );
};

export default NewsletterSection;
