import "server-only";

import type { Prisma, StockReason } from "@/lib/generated/prisma/client";

/*
 * Logs a stock change inside the transaction that made it, reading the
 * resulting stock so the history shows what the count became.
 */
export async function recordStockMovement(
  tx: Prisma.TransactionClient,
  {
    productId,
    change,
    reason,
    orderId,
    actorEmail,
  }: {
    productId: string;
    change: number;
    reason: StockReason;
    orderId?: string;
    actorEmail?: string | null;
  },
) {
  if (change === 0) return;

  const product = await tx.product.findUnique({
    where: {
      id: productId,
    },
    select: {
      stock: true,
    },
  });

  if (!product) return;

  await tx.stockMovement.create({
    data: {
      productId,
      change,
      stockAfter: product.stock,
      reason,
      orderId: orderId ?? null,
      actorEmail: actorEmail ?? null,
    },
  });
}
