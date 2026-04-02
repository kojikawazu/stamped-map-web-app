import { PrismaClient } from "../../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  // Prisma singleton はモジュール評価時（Nuxt event context 外）に初期化されるため
  // useRuntimeConfig() は使用できない。DATABASE_URL を直接参照する。
  // nuxt.config.ts の runtimeConfig.databaseUrl（NUXT_DATABASE_URL）とは別変数。
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
