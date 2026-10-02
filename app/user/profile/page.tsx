import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SessionProvider } from "next-auth/react";

import { auth } from "@/auth";
import { getUserById } from "@/lib/actions/user.actions";

import EmailVerificationNotice from "./email-verification-notice";
import ProfileForm from "./profile-form";

export const metadata: Metadata = {
  title: "Customer Profile",
};

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const user = await getUserById(session.user.id);

  return (
    <SessionProvider session={session}>
      <div className="mx-auto max-w-md space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Profile</h2>

        {!user.emailVerified && <EmailVerificationNotice />}

        <ProfileForm />
      </div>
    </SessionProvider>
  );
}
