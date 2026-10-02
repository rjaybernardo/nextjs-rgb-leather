import { auth } from "@/auth";
import { redirect } from "next/navigation";

// For pages: redirects non-admins to /unauthorized
export async function requireAdmin() {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    redirect("/unauthorized");
  }

  return session;
}

// For server action mutations: throws so the action's catch returns an error
export async function assertAdmin() {
  const session = await auth();

  if (session?.user?.role !== "admin") {
    throw new Error("You are not authorized to perform this action");
  }

  return session;
}
