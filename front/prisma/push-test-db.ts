import { execSync } from "node:child_process";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveTestDatabaseUrl } from "../lib/test-database-url";

// ローカルのテスト DB（E2E 用）へスキーマを同期する。
// prisma CLI は schema.prisma の env("DATABASE_URL") / env("DIRECT_URL") を読むが、
// 未指定だと .env（本番 Supabase）が使われる。接続先ガードを通した URL で両方を
// 明示的に上書きしてから実行し、ローカル以外なら db push の前に throw する。
const url = resolveTestDatabaseUrl();
console.log(`Pushing schema to test database at ${new URL(url).host}`);

// テスト DB は使い捨てのため --accept-data-loss を付ける（本番には絶対に付けない）。
execSync("pnpm exec prisma db push --accept-data-loss", {
  cwd: dirname(dirname(fileURLToPath(import.meta.url))),
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
});
