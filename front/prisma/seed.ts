import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// seed は直接接続（DIRECT_URL）を優先、なければ DATABASE_URL にフォールバック
const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const defaultCategories = [
  { name: "食事", color: "#EF4444", sortOrder: 1 },
  { name: "自然", color: "#22C55E", sortOrder: 2 },
  { name: "観光", color: "#3B82F6", sortOrder: 3 },
  { name: "ショッピング", color: "#A855F7", sortOrder: 4 },
  { name: "その他", color: "#6B7280", sortOrder: 5 },
];

async function main() {
  for (const cat of defaultCategories) {
    await prisma.mapCategory.upsert({
      where: { name: cat.name },
      update: {},
      create: {
        name: cat.name,
        color: cat.color,
        isDefault: true,
        sortOrder: cat.sortOrder,
      },
    });
  }
  console.log("Default categories seeded.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
