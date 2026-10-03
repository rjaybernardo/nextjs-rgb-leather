import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth, isGoogleSignInEnabled } from "@/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getSafeCallbackUrl } from "@/lib/utils";

import GoogleSignInButton from "@/components/shared/auth/google-sign-in-button";

import CredentialsSignInForm from "./credentials-signin-form";
import SiteLogo from "@/components/shared/site-logo";

export const metadata: Metadata = {
  title: "Sign In",
};

type SignInPageProps = {
  searchParams: Promise<{
    callbackUrl?: string | string[];
  }>;
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;

  const callbackUrl = Array.isArray(params.callbackUrl)
    ? params.callbackUrl[0]
    : params.callbackUrl;

  const session = await auth();

  if (session) {
    redirect(getSafeCallbackUrl(callbackUrl));
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <Card>
        <CardHeader className="space-y-4">
          <Link href="/" className="flex items-center justify-center">
            <SiteLogo size={100} priority />
          </Link>

          <CardTitle className="text-center">Sign In</CardTitle>

          <CardDescription className="text-center">
            Select a method to sign in to your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {(await isGoogleSignInEnabled()) && <GoogleSignInButton callbackUrl={callbackUrl} />}

          <CredentialsSignInForm />
        </CardContent>
      </Card>
    </div>
  );
}
