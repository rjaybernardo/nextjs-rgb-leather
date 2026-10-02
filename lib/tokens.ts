import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { prisma } from "@/lib/prisma";

type TokenPurpose = "reset" | "verify";

const hashToken = (token: string) =>
  createHash("sha256").update(token).digest("hex");

const identifierFor = (purpose: TokenPurpose, email: string) =>
  `${purpose}:${email}`;

// Issues a single-use token; only its hash is stored
export async function createToken(
  purpose: TokenPurpose,
  email: string,
  ttlMs: number,
) {
  const token = randomBytes(32).toString("hex");
  const identifier = identifierFor(purpose, email);

  await prisma.$transaction([
    prisma.verificationToken.deleteMany({
      where: {
        identifier,
      },
    }),
    prisma.verificationToken.create({
      data: {
        identifier,
        token: hashToken(token),
        expires: new Date(Date.now() + ttlMs),
      },
    }),
  ]);

  return token;
}

// Atomically consumes the token; true only for a valid, unexpired token
export async function consumeToken(
  purpose: TokenPurpose,
  email: string,
  token: string,
) {
  const { count } = await prisma.verificationToken.deleteMany({
    where: {
      identifier: identifierFor(purpose, email),
      token: hashToken(token),
      expires: {
        gt: new Date(),
      },
    },
  });

  return count === 1;
}
