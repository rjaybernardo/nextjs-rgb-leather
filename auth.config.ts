import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  pages: {
    signIn: "/sign-in",
  },

  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnProtectedRoute =
        nextUrl.pathname.startsWith("/account") ||
        nextUrl.pathname.startsWith("/admin");

      if (isOnProtectedRoute) {
        return isLoggedIn;
      }

      return true;
    },
  },

  providers: [],
} satisfies NextAuthConfig;
