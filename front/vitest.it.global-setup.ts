import { execSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { GlobalSetupContext } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    databaseUrl: string;
  }
}

/**
 * IT（統合テスト）用の PostGIS コンテナを起動し、スキーマを db push する。
 *
 * schema.prisma が `extensions = [postgis]` を宣言しているため、素の postgres では
 * `prisma db push` が失敗する。PostGIS 入りイメージを使用する。
 * 接続 URL は `provide("databaseUrl")` で各テストワーカーへ渡す。
 *
 * @returns コンテナを停止する teardown 関数
 */
export default async function ({ provide }: GlobalSetupContext) {
  const container = await new PostgreSqlContainer("postgis/postgis:16-3.4")
    .withDatabase("stamped_test")
    .withUsername("test")
    .withPassword("test")
    .start();

  const url = container.getConnectionUri();

  // マイグレーションファイルを持たない db push 運用に合わせ、スキーマを直接同期する。
  execSync("pnpm exec prisma db push --skip-generate --accept-data-loss", {
    cwd: dirname(fileURLToPath(import.meta.url)),
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });

  provide("databaseUrl", url);

  return async () => {
    await container.stop();
  };
}
