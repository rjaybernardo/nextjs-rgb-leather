"use server";

import { requireAdmin } from "@/lib/auth-guard";
import { prisma } from "@/lib/prisma";

const ACTIVITY_PAGE_SIZE = 25;

export async function getAuditLog({ page }: { page: number }) {
  await requireAdmin();

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: ACTIVITY_PAGE_SIZE,
      skip: (page - 1) * ACTIVITY_PAGE_SIZE,
    }),
    prisma.auditLog.count(),
  ]);

  return {
    entries,
    totalPages: Math.max(1, Math.ceil(total / ACTIVITY_PAGE_SIZE)),
  };
}

export async function getStockHistory(productId: string) {
  await requireAdmin();

  return prisma.stockMovement.findMany({
    where: {
      productId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 20,
  });
}
