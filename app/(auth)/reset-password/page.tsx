import type { Metadata } from "next";
import Link from "next/link";

import AuthCard from "@/components/shared/auth/auth-card";

import ResetPasswordForm from "./reset-password-form";

export const metadata: Metadata = {
  title: "Reset Password",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{
    email?: string;
    token?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const { email, token } = await searchParams;

  if (typeof email !== "string" || typeof token !== "string") {
    return (
      <AuthCard
        title="Invalid reset link"
        description="This link is incomplete. Request a new one to continue."
      >
        <div className="text-center">
          <Link className="link text-sm" href="/forgot-password">
            Request a new link
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Choose a new password"
      description={`For ${email}`}
    >
      <ResetPasswordForm email={email} token={token} />
    </AuthCard>
  );
}
