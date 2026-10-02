import { compare } from "bcrypt-ts-edge";
import type { NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";

import { PrismaAdapter } from "@auth/prisma-adapter";

import { authConfig } from "@/auth.config";
import { persistGuestCart } from "@/lib/guest-cart";
import { prisma } from "@/lib/prisma";

// Google sign-in turns on once both credentials are set
export const googleSignInEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);

export const authConfigWithCredentials = {
  ...authConfig,

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  adapter: PrismaAdapter(prisma),

  providers: [
    Credentials({
      credentials: {
        email: {
          type: "email",
        },
        password: {
          type: "password",
        },
      },

      async authorize(credentials) {
        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string"
        ) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.password) {
          return null;
        }

        const passwordMatches = await compare(
          credentials.password,
          user.password,
        );

        if (!passwordMatches) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),

    ...(googleSignInEnabled
      ? [
          Google({
            // Lets a customer who registered with a password sign in with
            // Google using the same email. Safe because Google verifies
            // email ownership, and the signIn callback rejects unverified ones.
            allowDangerousEmailAccountLinking: true,
            profile(profile) {
              return {
                id: profile.sub,
                name: profile.name || profile.email?.split("@")[0] || "NO_NAME",
                email: profile.email,
                image: profile.picture,
                // New accounts are customers; Google already confirmed the email
                role: "user",
                emailVerified: profile.email_verified ? new Date() : null,
              };
            },
          }),
        ]
      : []),
  ],

  events: {
    // Password sign-in merges the guest cart in its own action
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.id) {
        await persistGuestCart(user.id);
      }
    },
  },

  callbacks: {
    signIn({ account, profile }) {
      if (account?.provider === "google") {
        return profile?.email_verified === true;
      }

      return true;
    },

    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;

        if (user.name === "NO_NAME" && user.email) {
          const generatedName = user.email.split("@")[0];

          token.name = generatedName;

          await prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              name: generatedName,
            },
          });
        } else {
          token.name = user.name;
        }
      }

      if (trigger === "update" && session?.user?.name) {
        token.name = session.user.name;
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        if (typeof token.id === "string") {
          session.user.id = token.id;
        }

        session.user.name = typeof token.name === "string" ? token.name : null;

        if (typeof token.role === "string") {
          session.user.role = token.role;
        }
      }

      return session;
    },
  },
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth(
  authConfigWithCredentials,
);
