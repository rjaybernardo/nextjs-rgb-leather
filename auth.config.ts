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
  /^\/studio(?:\/.*)?$/,
];

export const isProtectedPath = (pathname: string) =>
  protectedPaths.some((pattern) => pattern.test(pathname));

// Edge/proxy-safe config: no database adapter or providers
export const authConfig = {
  pages: {
    signIn: "/sign-in",
  },

  providers: [],
} satisfies NextAuthConfig;
