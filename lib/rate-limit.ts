import "server-only";

import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";

export async function getClientIp() {
  const headerList = await headers();

  return (
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown"
  );
}

/*
 * Fixed-window limiter backed by the RateLimit table. One atomic upsert per
 * call: the counter resets once its window has passed.
 */
export async function rateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowMs);

  const [row] = await prisma.$queryRaw<{ count: number; resetAt: Date }[]>`
    INSERT INTO "RateLimit" ("key", "count", "resetAt")
    VALUES (${key}, 1, ${resetAt.toISOString()}::timestamp)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE
        WHEN "RateLimit"."resetAt" <= ${now.toISOString()}::timestamp THEN 1
        ELSE "RateLimit"."count" + 1
      END,
      "resetAt" = CASE
        WHEN "RateLimit"."resetAt" <= ${now.toISOString()}::timestamp
          THEN ${resetAt.toISOString()}::timestamp
        ELSE "RateLimit"."resetAt"
      END
    RETURNING "count", "resetAt"
  `;

  // Occasionally clear out expired counters
  if (Math.random() < 0.01) {
    await prisma.rateLimit.deleteMany({
      where: {
        resetAt: {
          lt: now,
        },
      },
    });
  }

  const retryAfterMs = Math.max(
    0,
    new Date(row.resetAt).getTime() - now.getTime(),
  );

  return {
    success: Number(row.count) <= limit,
    retryAfterMs,
  };
}

// Throws a customer-friendly error when the limit is exceeded
export async function assertRateLimit(options: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const result = await rateLimit(options);

  if (!result.success) {
    const minutes = Math.max(1, Math.ceil(result.retryAfterMs / 60_000));

    throw new Error(
      `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    );
  }
}
