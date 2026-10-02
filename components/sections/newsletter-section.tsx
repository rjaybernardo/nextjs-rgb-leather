"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeNewsletter } from "@/lib/actions/studio.actions";
import type { SectionData } from "@/lib/site-config";
import { cn } from "@/lib/utils";

const initialState = { success: false, message: "" };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Subscribing..." : label}
    </Button>
  );
}

const NewsletterSection = ({ data }: { data: SectionData<"newsletter"> }) => {
  const [state, action] = useActionState(subscribeNewsletter, initialState);

  return (
    <section className="rounded-lg bg-muted px-6 py-10 text-center">
      <div className="mx-auto max-w-lg space-y-4">
        <h2 className="h2-bold">{data.title}</h2>
        {data.text && <p className="text-muted-foreground">{data.text}</p>}

        {state.success ? (
          <p role="status" className="font-medium">
            {state.message}
          </p>
        ) : (
          <form action={action} className="flex flex-col gap-2 sm:flex-row">
            <label htmlFor="newsletter-email" className="sr-only">
              Email address
            </label>

            <Input
              id="newsletter-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              className="bg-background"
            />

            <SubmitButton label={data.buttonText} />
          </form>
        )}

        {!state.success && state.message && (
          <p role="status" className={cn("text-sm text-destructive")}>
            {state.message}
          </p>
        )}
      </div>
    </section>
  );
};

export default NewsletterSection;
