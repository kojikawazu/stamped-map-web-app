import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// IT（統合テスト）専用設定。実 PostGIS コンテナ（Testcontainers）に対して
// Server ハンドラ + 実 Prisma を検証する。Nuxt ランタイムは不要なため node 環境で軽量に走らせる。
const root = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig({
  resolve: {
    // server ハンドラ内の `~/lib/...` エイリアスを解決する。
    alias: { "~": root, "@": root },
  },
  test: {
    environment: "node",
    include: ["__tests__/**/*.it.test.ts"],
    globalSetup: ["./vitest.it.global-setup.ts"],
    setupFiles: ["./vitest.it.setup.ts"],
    // 単一 DB を共有するため、ファイル並列を無効化して truncate 競合を防ぐ。
    fileParallelism: false,
    // コンテナ起動 + db push のぶんフックのタイムアウトを延ばす。
    hookTimeout: 120_000,
    testTimeout: 30_000,
  },
});
