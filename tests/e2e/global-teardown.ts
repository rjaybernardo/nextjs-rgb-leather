import { cleanUpE2eCoupons, cleanUpE2eData, cleanUpE2eProducts, createTestDb } from "./db";

export default async function globalTeardown() {
  if (process.env.E2E_KEEP_DATA === "1") return;

  const db = createTestDb();

  try {
    await cleanUpE2eData(db);
    await cleanUpE2eCoupons(db);
    await cleanUpE2eProducts(db);
  } finally {
    await db.$disconnect();
  }
}
