import type { NextAuthConfig } from "next-auth";

const protectedPaths = [
  /^\/shipping-address$/,
  /^\/payment-method$/,
  /^\/place-order$/,
  /^\/profile$/,
  /^\/user(?:\/.*)?$/,
  /^\/order(?:\/.*)?$/,
  /^\/account(?:\/.*)?$/,
  /^\/admin(?:\/.*)?$/,
];

export const authConfig = {
  pages: {
    signIn: "/sign-in",
  },

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      const isProtectedRoute = protectedPaths.some((pattern) =>
        pattern.test(nextUrl.pathname),
      );

      if (isProtectedRoute) {
        return isLoggedIn;
      }

      return true;
    },
  },

  providers: [],
} satisfies NextAuthConfig;
