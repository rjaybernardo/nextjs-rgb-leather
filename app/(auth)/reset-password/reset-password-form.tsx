"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPassword } from "@/lib/actions/user.actions";

const initialState = {
  success: false,
  message: "",
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Saving..." : "Reset password"}
    </Button>
  );
}

type ResetPasswordFormProps = {
  email: string;
  token: string;
};

export default function ResetPasswordForm({
  email,
  token,
}: ResetPasswordFormProps) {
  const [data, action] = useActionState(resetPassword, initialState);

  if (data.success) {
    return (
      <div className="space-y-6 text-center">
        <p className="text-muted-foreground">{data.message}</p>

        <Link className="link text-sm" href="/sign-in">
          Sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={action}>
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="token" value={token} />

      <div className="space-y-6">
        <div>
          <Label htmlFor="password">New password</Label>

          <Input
            id="password"
            name="password"
            required
            type="password"
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm new password</Label>

          <Input
            id="confirmPassword"
            name="confirmPassword"
            required
            type="password"
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <SubmitButton />

        {data.message && (
          <div className="space-y-2 text-center text-destructive">
            <p>{data.message}</p>

            <Link className="link text-sm" href="/forgot-password">
              Request a new link
            </Link>
          </div>
        )}
      </div>
    </form>
  );
}
