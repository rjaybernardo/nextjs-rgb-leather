import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";

import SignUpForm from "./signup-form";

export const metadata: Metadata = {
  title: "Sign Up",
};

type SignUpPageProps = {
  searchParams: Promise<{
    callbackUrl?: string | string[];
  }>;
};

const SignUp = async ({ searchParams }: SignUpPageProps) => {
  const params = await searchParams;

  const callbackUrl = Array.isArray(params.callbackUrl)
    ? params.callbackUrl[0]
    : params.callbackUrl;

  const session = await auth();

  if (session) {
    redirect(callbackUrl || "/");
  }

  return (
    <div className="mx-auto w-full max-w-md">
      <Card>
        <CardHeader className="space-y-4">
          <Link href="/" className="flex items-center justify-center">
            <Image
              priority
              src="/images/logo.svg"
              width={100}
              height={100}
              alt={`${APP_NAME} logo`}
            />
          </Link>

          <CardTitle className="text-center">Create Account</CardTitle>

          <CardDescription className="text-center">
            Enter your information below to create your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <SignUpForm />
        </CardContent>
      </Card>
    </div>
  );
};

export default SignUp;
