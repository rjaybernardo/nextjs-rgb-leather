import { cleanUpE2eData, createTestDb } from "./db";

export default async function globalTeardown() {
  if (process.env.E2E_KEEP_DATA === "1") return;

  const db = createTestDb();

  try {
    await cleanUpE2eData(db);
  } finally {
    await db.$disconnect();
  }
}
