"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInWithCredentials } from "@/lib/actions/user.actions";
import { signInDefaultValues } from "@/lib/constants";

const initialState = {
  success: false,
  message: "",
};

function SignInButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full"
      variant="default"
    >
      {pending ? "Signing In..." : "Sign In with credentials"}
    </Button>
  );
}

export default function CredentialsSignInForm() {
  const [data, action] = useActionState(signInWithCredentials, initialState);

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  return (
    <form action={action}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div className="space-y-6">
        <div>
          <Label htmlFor="email">Email</Label>

          <Input
            id="email"
            name="email"
            required
            type="email"
            defaultValue={signInDefaultValues.email}
            autoComplete="email"
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>

          <Input
            id="password"
            name="password"
            required
            type="password"
            defaultValue={signInDefaultValues.password}
            autoComplete="current-password"
          />
        </div>

        <div>
          <SignInButton />
        </div>

        {!data.success && data.message && (
          <div className="text-center text-destructive">{data.message}</div>
        )}

        <div className="text-center text-sm text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link className="link" href="/sign-up">
            Sign Up
          </Link>
        </div>
      </div>
    </form>
  );
}
