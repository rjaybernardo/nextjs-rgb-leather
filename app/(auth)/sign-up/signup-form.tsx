"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUp } from "@/lib/actions/user.actions";
import { signUpDefaultValues } from "@/lib/constants";

const initialState = {
  message: "",
  success: false,
};

function SignUpButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      disabled={pending}
      className="w-full"
      variant="default"
    >
      {pending ? "Submitting..." : "Sign Up"}
    </Button>
  );
}

const SignUpForm = () => {
  const [data, action] = useActionState(signUp, initialState);

  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  return (
    <form action={action}>
      <input type="hidden" name="callbackUrl" value={callbackUrl} />

      <div className="space-y-6">
        <div>
          <Label htmlFor="name">Name</Label>

          <Input
            id="name"
            name="name"
            required
            type="text"
            defaultValue={signUpDefaultValues.name}
            autoComplete="name"
          />
        </div>

        <div>
          <Label htmlFor="email">Email</Label>

          <Input
            id="email"
            name="email"
            required
            type="email"
            defaultValue={signUpDefaultValues.email}
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
            defaultValue={signUpDefaultValues.password}
            autoComplete="new-password"
          />
        </div>

        <div>
          <Label htmlFor="confirmPassword">Confirm Password</Label>

          <Input
            id="confirmPassword"
            name="confirmPassword"
            required
            type="password"
            defaultValue={signUpDefaultValues.confirmPassword}
            autoComplete="new-password"
          />
        </div>

        <div>
          <SignUpButton />
        </div>

        {!data.success && data.message && (
          <div className="text-center text-destructive">{data.message}</div>
        )}

        <div className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className="link"
          >
            Sign In
          </Link>
        </div>
      </div>
    </form>
  );
};

export default SignUpForm;
