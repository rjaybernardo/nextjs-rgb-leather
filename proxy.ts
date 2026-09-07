import { auth } from "@/auth";
import { NextResponse } from "next/server";

export const proxy = auth((request) => {
  const sessionCartId = request.cookies.get("sessionCartId")?.value;

  if (sessionCartId) {
    return NextResponse.next();
  }

  const response = NextResponse.next();

  response.cookies.set("sessionCartId", crypto.randomUUID(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
});

export const config = {
  matcher: [
    /*
     * Run Proxy on application pages, but skip:
     * - API routes
     * - Next.js internals
     * - static files
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
