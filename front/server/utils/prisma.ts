import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Prisma singleton はモジュール評価時（Nuxt event context 外）に初期化されるため
  // useRuntimeConfig() は使用できない。DATABASE_URL を直接参照する。
  // nuxt.config.ts の runtimeConfig.databaseUrl（NUXT_DATABASE_URL）とは別変数。
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });
  return new PrismaClient({ adapter });
}

/**
 * アプリ全体で共有する PrismaClient。
 *
 * 遅延初期化する Proxy として公開しており、実クライアントは最初のプロパティ
 * アクセス時にのみ生成される。サーバー起動時点で `DATABASE_URL` が無い環境
 * （E2E CI のビルド時等）でもクラッシュさせないための構造。
 * 生成済みインスタンスは `globalThis` に保持し、HMR による接続の増殖を防ぐ。
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient();
    }
    // PrismaClient はインデックスシグネチャを持たないため、任意プロパティ（メソッド名）を
    // 動的取得するには unknown を経由してキャストする（プロキシで実プロパティに委譲するだけで安全）。
    const value = (
      globalForPrisma.prisma as unknown as Record<string | symbol, unknown>
    )[prop];
    return typeof value === "function"
      ? value.bind(globalForPrisma.prisma)
      : value;
  },
});
