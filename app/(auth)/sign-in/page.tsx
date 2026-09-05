import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Sign In",
};

export default function SignInPage() {
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

          <CardTitle className="text-center">Sign In</CardTitle>

          <CardDescription className="text-center">
            Select a method to sign in to your account
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Sign-in form will be added in the next lesson */}
        </CardContent>
      </Card>
    </div>
  );
}
