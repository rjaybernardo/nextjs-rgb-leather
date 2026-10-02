import type { Metadata } from "next";
import Link from "next/link";

import AuthCard from "@/components/shared/auth/auth-card";
import { prisma } from "@/lib/prisma";
import { consumeToken } from "@/lib/tokens";

export const metadata: Metadata = {
  title: "Confirm Email",
};

type VerifyEmailPageProps = {
  searchParams: Promise<{
    email?: string;
    token?: string;
  }>;
};

async function verify(email: unknown, token: unknown) {
  if (typeof email !== "string" || typeof token !== "string") {
    return false;
  }

  const isValid = await consumeToken("verify", email, token);

  if (!isValid) {
    return false;
  }

  await prisma.user.update({
    where: {
      email,
    },
    data: {
      emailVerified: new Date(),
    },
  });

  return true;
}

export default async function VerifyEmailPage({
  searchParams,
}: VerifyEmailPageProps) {
  const { email, token } = await searchParams;

  const verified = await verify(email, token);

  return (
    <AuthCard
      title={verified ? "Email confirmed" : "Link expired"}
      description={
        verified
          ? "Thanks for confirming your email address."
          : "This confirmation link is invalid or has already been used. You can send a new one from your profile."
      }
    >
      <div className="text-center">
        <Link className="link text-sm" href={verified ? "/" : "/user/profile"}>
          {verified ? "Continue shopping" : "Go to your profile"}
        </Link>
      </div>
    </AuthCard>
  );
}
