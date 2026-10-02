import { cleanUpE2eData, createTestDb } from "./db";

export default async function globalSetup() {
  const db = createTestDb();

  try {
    // Leftovers from an interrupted run
    await cleanUpE2eData(db);

    // Local runs share one IP; don't let earlier runs trip the sign-up and
    // sign-in limits (5 sign-ups per hour per IP)
    await db.rateLimit.deleteMany({
      where: {
        OR: [
          { key: { startsWith: "signup-ip:" } },
          { key: { startsWith: "signin-ip:" } },
          { key: { startsWith: "signin-email:" } },
          { key: { startsWith: "order:" } },
        ],
      },
    });

    // A product with stock for the test to buy
    const product = await db.product.findFirst({
      where: {
        stock: {
          gte: 2,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
      select: {
        slug: true,
        name: true,
      },
    });

    if (!product) {
      throw new Error("No product with at least 2 in stock to test checkout with");
    }

    const admin = await db.user.findFirst({
      where: {
        role: "admin",
      },
      select: {
        email: true,
      },
    });

    if (!admin) {
      throw new Error("No admin user found; run the seed (npx prisma db seed)");
    }

    // Read by the tests through process.env
    process.env.E2E_PRODUCT_SLUG = product.slug;
    process.env.E2E_PRODUCT_NAME = product.name;
    process.env.E2E_ADMIN_EMAIL ??= admin.email;
  } finally {
    await db.$disconnect();
  }
}
