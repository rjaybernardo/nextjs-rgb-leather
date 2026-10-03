-- API keys and integration settings managed in Admin → Settings.
-- Additive only: existing deployments keep using environment variables
-- until an admin saves a value.

-- CreateTable
CREATE TABLE "StoreSecret" (
    "name" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "hint" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StoreSecret_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "IntegrationSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "data" JSON NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IntegrationSettings_pkey" PRIMARY KEY ("id")
);
