import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig, isProtectedPath } from "@/auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth((request) => {
  // Send signed-out visitors on protected routes to sign in
  if (!request.auth?.user && isProtectedPath(request.nextUrl.pathname)) {
    const signInUrl = new URL(authConfig.pages.signIn, request.nextUrl);
    signInUrl.searchParams.set("callbackUrl", request.nextUrl.href);

    return NextResponse.redirect(signInUrl);
  }

  const response = NextResponse.next();

  // Only issue a cart session if the visitor doesn't already have one
  if (!request.cookies.has("sessionCartId")) {
    response.cookies.set("sessionCartId", crypto.randomUUID(), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }

  return response;
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
