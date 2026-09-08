import { NextResponse } from "next/server";

export const proxy = () => {
  const response = NextResponse.next();

  const sessionCartId = crypto.randomUUID();

  response.cookies.set("sessionCartId", sessionCartId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return response;
};

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
