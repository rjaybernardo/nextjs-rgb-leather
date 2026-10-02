import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

// The JWT role is only set at sign-in, so confirm it against the database
async function getAdminSession() {
  const session = await auth();

  if (!session?.user?.id || session.user.role !== "admin") {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      role: true,
    },
  });

  return user?.role === "admin" ? session : null;
}

// For UI: whether to show admin-only links and controls
export async function isAdmin() {
  return (await getAdminSession()) !== null;
}

// For pages: redirects non-admins to /unauthorized
export async function requireAdmin() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/unauthorized");
  }

  return session;
}

// For server action mutations: throws so the action's catch returns an error
export async function assertAdmin() {
  const session = await getAdminSession();

  if (!session) {
    throw new Error("You are not authorized to perform this action");
  }

  return session;
}
