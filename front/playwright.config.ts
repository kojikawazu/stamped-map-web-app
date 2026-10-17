import { defineConfig, devices } from "@playwright/test";
import { resolveTestDatabaseUrl } from "./lib/test-database-url";

// テスト DB の接続先（TEST_DATABASE_URL / 既定はローカル compose）。ローカル以外なら設定読込時に落とす。
const testDatabaseUrl = resolveTestDatabaseUrl();

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html"]] : "list",

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  // CI: 別ステップでビルド済みサーバーを起動。ローカル: pnpm dev を自動起動。
  // 自動起動するサーバーの DB はテスト DB に固定する（未指定だと Nuxt が .env の本番を読む）。
  // ※ reuseExistingServer で既存サーバーを再利用した場合、その DB 接続先はここでは制御できない。
  webServer: process.env.CI
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://localhost:3000",
        reuseExistingServer: true,
        timeout: 120_000,
        env: { DATABASE_URL: testDatabaseUrl, DIRECT_URL: testDatabaseUrl },
      },
});
