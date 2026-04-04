import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function createPrismaClient() {
  // Prisma singleton はモジュール評価時（Nuxt event context 外）に初期化されるため
  // useRuntimeConfig() は使用できない。DATABASE_URL を直接参照する。
  // nuxt.config.ts の runtimeConfig.databaseUrl（NUXT_DATABASE_URL）とは別変数。
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

// 遅延初期化: 最初のアクセス時にのみ PrismaClient を生成する。
// サーバー起動時に DATABASE_URL が存在しない環境（E2E CI 等）でもクラッシュしない。
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    const value = (globalForPrisma.prisma as Record<string | symbol, unknown>)[prop];
    return typeof value === "function" ? value.bind(globalForPrisma.prisma) : value;
  },
});
