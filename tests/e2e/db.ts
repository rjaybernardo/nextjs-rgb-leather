import "dotenv/config";

import net from "node:net";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../../lib/generated/prisma/client";

// Same connect-timeout fix as lib/prisma.ts (slow link to us-east-1)
net.setDefaultAutoSelectFamilyAttemptTimeout(1000);

export const E2E_EMAIL_PREFIX = "e2e+";
export const E2E_EMAIL_DOMAIN = "@example.com";

export function createTestDb() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("DATABASE_URL is not set; e2e tests need the dev database");
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

// Remove every throwaway e2e customer, their orders and the stock they took
export async function cleanUpE2eData(db: PrismaClient) {
  const users = await db.user.findMany({
    where: {
      email: {
        startsWith: E2E_EMAIL_PREFIX,
        endsWith: E2E_EMAIL_DOMAIN,
      },
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (users.length === 0) return 0;

  const userIds = users.map((user) => user.id);

  const orders = await db.order.findMany({
    where: {
      userId: {
        in: userIds,
      },
    },
    include: {
      orderitems: true,
    },
  });

  const orderIds = orders.map((order) => order.id);

  await db.$transaction(async (tx) => {
    // Give back stock from orders that still hold it (cancelled ones already did)
    for (const order of orders) {
      if (order.status === "CANCELLED") continue;

      for (const item of order.orderitems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.qty } },
        });
      }
    }

    await tx.stockMovement.deleteMany({ where: { orderId: { in: orderIds } } });
    await tx.auditLog.deleteMany({ where: { entityId: { in: orderIds } } });
    await tx.order.deleteMany({ where: { id: { in: orderIds } } });
    await tx.cart.deleteMany({ where: { userId: { in: userIds } } });
    await tx.verificationToken.deleteMany({
      where: {
        OR: users.flatMap((user) => [
          { identifier: `verify:${user.email}` },
          { identifier: `reset:${user.email}` },
        ]),
      },
    });
    // Addresses, wishlist items and reviews cascade from the user
    await tx.user.deleteMany({ where: { id: { in: userIds } } });
  });

  return users.length;
}
