-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE UNIQUE INDEX "Brand_name_key" ON "Brand"("name");
CREATE UNIQUE INDEX "Brand_slug_key" ON "Brand"("slug");

-- Slug matching the app's slugify(..., { lower: true, strict: true }) for
-- plain names: drop apostrophes, other non-alphanumerics become dashes
CREATE FUNCTION pg_temp.to_slug(value TEXT) RETURNS TEXT AS $$
  SELECT trim(both '-' from regexp_replace(
    regexp_replace(lower(trim(value)), '[''’]', '', 'g'),
    '[^a-z0-9]+', '-', 'g'))
$$ LANGUAGE SQL IMMUTABLE;

-- Backfill from the existing free-text values; names that only differ by
-- case or punctuation share a slug and are merged into one row
INSERT INTO "Category" ("name", "slug")
SELECT min(trim("category")), pg_temp.to_slug("category")
FROM "Product"
GROUP BY pg_temp.to_slug("category");

INSERT INTO "Brand" ("name", "slug")
SELECT min(trim("brand")), pg_temp.to_slug("brand")
FROM "Product"
GROUP BY pg_temp.to_slug("brand");

-- AlterTable: point products at the new rows
ALTER TABLE "Product" ADD COLUMN "categoryId" UUID,
ADD COLUMN "brandId" UUID;

UPDATE "Product" p SET "categoryId" = c."id"
FROM "Category" c WHERE c."slug" = pg_temp.to_slug(p."category");

UPDATE "Product" p SET "brandId" = b."id"
FROM "Brand" b WHERE b."slug" = pg_temp.to_slug(p."brand");

ALTER TABLE "Product" ALTER COLUMN "categoryId" SET NOT NULL,
ALTER COLUMN "brandId" SET NOT NULL;

ALTER TABLE "Product" DROP COLUMN "category",
DROP COLUMN "brand";

-- CreateIndex
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_brandId_idx" ON "Product"("brandId");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
