import { designSections } from "@/lib/design-preset";
import { prisma } from "@/lib/prisma";

import slugify from "slugify";

import sampleData from "./sample-data";

async function main() {
  console.log("🌱 Seeding database...");

  // Orders reference products (onDelete: Restrict), so clear them first
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.product.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  await prisma.stockMovement.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();

  // Products reference Category and Brand rows; create them as needed
  for (const { category, brand, ...product } of sampleData.products) {
    await prisma.product.create({
      data: {
        ...product,
        category: {
          connectOrCreate: {
            where: { slug: slugify(category, { lower: true, strict: true }) },
            create: {
              name: category,
              slug: slugify(category, { lower: true, strict: true }),
            },
          },
        },
        brand: {
          connectOrCreate: {
            where: { slug: slugify(brand, { lower: true, strict: true }) },
            create: {
              name: brand,
              slug: slugify(brand, { lower: true, strict: true }),
            },
          },
        },
      },
    });
  }

  await prisma.user.createMany({
    data: sampleData.users,
  });

  // The starter home page, only when there isn't one: home sections are
  // the store's own content, edited in Site Studio
  if ((await prisma.homeSection.count()) === 0) {
    await prisma.homeSection.createMany({
      data: designSections().map((section, position) => ({ ...section, position, enabled: true })),
    });
  }

  console.log("✅ Database seeded successfully.");
}

main()
  .catch((error) => {
    console.error("❌ Error while seeding the database:");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
