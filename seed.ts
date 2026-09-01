import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminEmail = (process.env.SEED_ADMIN_EMAIL ?? "admin@example.com").toLowerCase();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123";

  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Owner",
      passwordHash,
      role: "OWNER",
      status: "ACTIVE",
      balance: 0,
    },
  });
  console.log(`✔ Admin account ready: ${admin.email}`);

  const categories = [
    { name: "Instagram", nameAr: "انستقرام", slug: "instagram" },
    { name: "TikTok", nameAr: "تيك توك", slug: "tiktok" },
    { name: "YouTube", nameAr: "يوتيوب", slug: "youtube" },
  ];

  for (const [i, cat] of categories.entries()) {
    const category = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: { ...cat, order: i },
    });

    // NOTE: these are placeholder services with no real provider mapping.
    // Add a real Provider first via the admin UI, then create services
    // through /api/admin/services so they are correctly linked and priced.
    console.log(`  ↳ category ready: ${category.nameAr}`);
  }

  console.log("\nSeed complete.");
  console.log(`Log in at /login with:\n  email:    ${adminEmail}\n  password: ${adminPassword}`);
  console.log("IMPORTANT: change this password immediately after first login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
