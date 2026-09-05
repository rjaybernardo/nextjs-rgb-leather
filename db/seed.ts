import { prisma } from "@/lib/prisma";

import sampleData from "./sample-data";

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.product.deleteMany();
  await prisma.account.deleteMany();
  await prisma.session.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();

  await prisma.product.createMany({
    data: sampleData.products,
  });

  await prisma.user.createMany({
    data: sampleData.users,
  });

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
