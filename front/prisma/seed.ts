import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// seed は DATABASE_URL（PgBouncer 経由）を使用
const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL が設定されていません");
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const defaultCategories = [
  { name: "食事", color: "#EF4444", sortOrder: 1 },
  { name: "自然", color: "#22C55E", sortOrder: 2 },
  { name: "観光", color: "#3B82F6", sortOrder: 3 },
  { name: "ショッピング", color: "#A855F7", sortOrder: 4 },
  { name: "その他", color: "#6B7280", sortOrder: 5 },
];

const dummySpots = [
  { name: "渋谷スクランブル交差点", categoryName: "観光", latitude: 35.6595, longitude: 139.7004, visitedAt: new Date("2026-03-01"), memo: "すごい人混みだった" },
  { name: "新宿御苑", categoryName: "自然", latitude: 35.6851, longitude: 139.7100, visitedAt: new Date("2026-03-10"), memo: "桜が綺麗だった" },
  { name: "築地場外市場", categoryName: "食事", latitude: 35.6654, longitude: 139.7706, visitedAt: new Date("2026-03-15"), memo: "マグロが最高" },
  { name: "浅草寺", categoryName: "観光", latitude: 35.7148, longitude: 139.7967, visitedAt: new Date("2026-03-20"), memo: "雷門を初めて見た" },
  { name: "吉祥寺 ハモニカ横丁", categoryName: "食事", latitude: 35.7028, longitude: 139.5797, visitedAt: new Date("2026-03-25"), memo: "居酒屋めぐり" },
];

async function main() {
  // カテゴリ
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

  // ダミースポット
  for (const spot of dummySpots) {
    const category = await prisma.mapCategory.findUnique({ where: { name: spot.categoryName } });
    if (!category) continue;
    await prisma.mapSpot.create({
      data: {
        name: spot.name,
        categoryId: category.id,
        latitude: spot.latitude,
        longitude: spot.longitude,
        visitedAt: spot.visitedAt,
        memo: spot.memo,
      },
    });
  }
  console.log("Dummy spots seeded.");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
