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
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
