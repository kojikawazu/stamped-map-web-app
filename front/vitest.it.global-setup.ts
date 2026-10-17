import { execSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PostgreSqlContainer } from "@testcontainers/postgresql";
import type { TestProject } from "vitest/node";
import { assertLocalDatabaseUrl } from "./lib/test-database-url";

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
 * @param project - vitest が渡すプロジェクト。`provide` でワーカーへ値を渡すために使う
 * @returns コンテナを停止する teardown 関数
 */
export default async function (project: TestProject) {
  const container = await new PostgreSqlContainer("postgis/postgis:16-3.4")
    .withDatabase("stamped_test")
    .withUsername("test")
    .withPassword("test")
    .start();

  // Testcontainers の払い出し先も、db push（--accept-data-loss）の前に接続先ガードを通す。
  // DOCKER_HOST がリモートを指す等でループバック以外になった場合はここで止める。
  const url = assertLocalDatabaseUrl(container.getConnectionUri());

  // マイグレーションファイルを持たない db push 運用に合わせ、スキーマを直接同期する。
  execSync("pnpm exec prisma db push --skip-generate --accept-data-loss", {
    cwd: dirname(fileURLToPath(import.meta.url)),
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });

  project.provide("databaseUrl", url);

  return async () => {
    await container.stop();
  };
}
