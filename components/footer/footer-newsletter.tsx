"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { subscribeNewsletter } from "@/lib/actions/studio.actions";

const initialState = { success: false, message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-[52px] items-center justify-center rounded-full border border-[var(--on-night)] bg-[var(--on-night)] px-7 text-[15px] font-semibold text-[var(--brand)] transition-colors hover:bg-white disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tan)]"
    >
      {pending ? "Signing up..." : "Sign up"}
    </button>
  );
}

export default function FooterNewsletter() {
  const [state, action] = useActionState(subscribeNewsletter, initialState);

  if (state.success) {
    return (
      <p role="status" className="text-lg font-semibold">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="flex min-w-0 flex-col gap-3">
      <label htmlFor="footer-email" className="sr-only">
        Email address
      </label>

      <div className="flex flex-wrap gap-2.5">
        <input
          id="footer-email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="Email address"
          className="min-h-[52px] min-w-0 flex-1 rounded-full border border-[rgba(243,236,227,0.3)] bg-transparent px-5 text-[15px] text-[var(--on-night)] placeholder:text-[var(--on-night-muted)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--tan)]"
        />
        <SubmitButton />
      </div>

      <span className="text-xs text-[var(--on-night-muted)]" role={state.message ? "alert" : undefined}>
        {state.message || "Unsubscribe anytime."}
      </span>
    </form>
  );
}
