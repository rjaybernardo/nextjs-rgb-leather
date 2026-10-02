"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/actions/user.actions";

const initialState = {
  success: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Sending..." : "Send reset link"}
    </Button>
  );
}

export default function ForgotPasswordForm() {
  const [data, action] = useActionState(requestPasswordReset, initialState);

  if (data.success) {
    return (
      <div className="space-y-6 text-center">
        <p className="text-muted-foreground">{data.message}</p>

        <Link className="link text-sm" href="/sign-in">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action}>
      <div className="space-y-6">
        <div>
          <Label htmlFor="email">Email</Label>

          <Input
            id="email"
            name="email"
            required
            type="email"
            autoComplete="email"
          />
        </div>

        <SubmitButton />

        {data.message && (
          <div className="text-center text-destructive">{data.message}</div>
        )}

        <div className="text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link className="link" href="/sign-in">
            Sign In
          </Link>
        </div>
      </div>
    </form>
  );
}
