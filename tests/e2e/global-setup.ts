import {
  cleanUpE2eCoupons,
  cleanUpE2eData,
  cleanUpE2eProducts,
  createTestDb,
  E2E_COUPON_CODE,
  E2E_VARIANT_PRODUCT_SLUG,
} from "./db";

export default async function globalSetup() {
  const db = createTestDb();

  try {
    // Leftovers from an interrupted run
    await cleanUpE2eData(db);
    await cleanUpE2eCoupons(db);
    await cleanUpE2eProducts(db);

    // 10% off, once per customer, for the checkout test
    await db.coupon.create({
      data: {
        code: E2E_COUPON_CODE,
        description: "Created by the e2e tests",
        type: "PERCENT",
        value: 10,
        perCustomerLimit: 1,
      },
    });

    // Local runs share one IP; don't let earlier runs trip the sign-up and
    // sign-in limits (5 sign-ups per hour per IP)
    await db.rateLimit.deleteMany({
      where: {
        OR: [
          { key: { startsWith: "signup-ip:" } },
          { key: { startsWith: "signin-ip:" } },
          { key: { startsWith: "signin-email:" } },
          { key: { startsWith: "order:" } },
          { key: { startsWith: "newsletter:" } },
          { key: { startsWith: "coupon:" } },
        ],
      },
    });

    // A plain product for the variants test to add options to
    const [category, brand] = await Promise.all([
      db.category.findFirstOrThrow({ select: { id: true } }),
      db.brand.findFirstOrThrow({ select: { id: true } }),
    ]);

    await db.product.create({
      data: {
        name: "E2E Variant Belt",
        slug: E2E_VARIANT_PRODUCT_SLUG,
        categoryId: category.id,
        brandId: brand.id,
        description: "Created by the e2e tests",
        images: ["/images/sample-products/p1-1.jpg"],
        price: 1000,
        stock: 0,
      },
    });

    // A product with stock for the test to buy
    const product = await db.product.findFirst({
      where: {
        stock: {
          gte: 2,
        },
        slug: {
          not: { startsWith: "e2e-" },
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
