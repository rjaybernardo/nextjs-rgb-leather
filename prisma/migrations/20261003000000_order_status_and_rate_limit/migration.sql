-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED');

-- AlterTable: add status and lifecycle timestamps
ALTER TABLE "Order" ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "shippedAt" TIMESTAMP(6),
ADD COLUMN     "cancelledAt" TIMESTAMP(6);

-- Backfill status from the old flags
UPDATE "Order" SET "status" = CASE
  WHEN "isDelivered" THEN 'DELIVERED'::"OrderStatus"
  WHEN "isPaid" THEN 'PAID'::"OrderStatus"
  ELSE 'PENDING'::"OrderStatus"
END;

-- AlterTable: drop the old flags (paidAt / deliveredAt are kept)
ALTER TABLE "Order" DROP COLUMN "isDelivered",
DROP COLUMN "isPaid";

-- CreateTable
CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,
    "resetAt" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);
