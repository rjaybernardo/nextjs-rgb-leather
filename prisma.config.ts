import "dotenv/config";

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",

  migrations: {
    path: "prisma/migrations",
    // lib/prisma is server-only; this condition lets the seed import it
    seed: "tsx --conditions=react-server db/seed.ts",
  },

  // Migrations need a direct connection: session-level advisory locks
  // don't work reliably through Neon's pooler
  datasource: {
    url: process.env.DIRECT_DATABASE_URL ?? env("DATABASE_URL"),
  },
});
