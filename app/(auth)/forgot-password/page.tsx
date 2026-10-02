import type { Metadata } from "next";

import AuthCard from "@/components/shared/auth/auth-card";

import ForgotPasswordForm from "./forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot Password",
};

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Forgot your password?"
      description="Enter your email and we'll send you a link to reset it"
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
