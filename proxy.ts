import { NextResponse, type NextRequest } from "next/server";

export const proxy = (request: NextRequest) => {
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
};

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
