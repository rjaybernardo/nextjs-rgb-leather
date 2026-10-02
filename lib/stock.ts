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
    variantTitle,
  }: {
    productId: string;
    change: number;
    reason: StockReason;
    orderId?: string;
    actorEmail?: string | null;
    // e.g. "Brown / M" when the change was to one variant
    variantTitle?: string | null;
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
      variantTitle: variantTitle ?? null,
    },
  });
}

/*
 * A product with variants lists the lowest variant price and the total
 * variant stock, so search, sorting, price filters and low-stock alerts keep
 * working on the product.
 */
export async function syncProductFromVariants(tx: Prisma.TransactionClient, productId: string) {
  const variants = await tx.productVariant.findMany({
    where: { productId },
    select: { price: true, stock: true },
  });

  if (variants.length === 0) return;

  const prices = variants
    .map((variant) => (variant.price === null ? null : Number(variant.price)))
    .filter((price): price is number => price !== null);

  await tx.product.update({
    where: { id: productId },
    data: {
      stock: variants.reduce((sum, variant) => sum + variant.stock, 0),
      ...(prices.length > 0 ? { price: Math.min(...prices) } : {}),
    },
  });
}
