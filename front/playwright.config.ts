import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",

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

  // CI: ビルド済みの Nitro サーバーを直接起動。ローカル: 既存の dev サーバーを再利用。
  webServer: {
    command: process.env.CI
      ? "node .output/server/index.mjs"
      : "pnpm dev",
    url: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
    env: {
      NUXT_PUBLIC_SUPABASE_URL: process.env.NUXT_PUBLIC_SUPABASE_URL ?? "https://dummy.supabase.co",
      NUXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY ?? "dummy-anon-key",
      NUXT_PUBLIC_MAPTILER_KEY: process.env.NUXT_PUBLIC_MAPTILER_KEY ?? "dummy-maptiler-key",
      DATABASE_URL: process.env.DATABASE_URL ?? "postgresql://dummy:dummy@localhost:5432/dummy",
      SUPABASE_URL: process.env.NUXT_PUBLIC_SUPABASE_URL ?? "https://dummy.supabase.co",
      SUPABASE_KEY: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY ?? "dummy-anon-key",
      PORT: "3000",
      HOST: "0.0.0.0",
    },
  },
});
