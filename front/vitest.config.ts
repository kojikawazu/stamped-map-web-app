import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    environment: "nuxt",
    // IT（*.it.test.ts）は実 DB コンテナが必要なため、ユニット実行からは除外する
    // （専用の vitest.config.it.ts / pnpm test:it で実行する）。
    exclude: ["tests/e2e/**", "node_modules/**", "**/*.it.test.ts"],
    setupFiles: ["./vitest.setup.ts"],
    env: {
      SUPABASE_URL: "https://dummy.supabase.co",
      SUPABASE_KEY: "dummy-anon-key",
      NUXT_PUBLIC_MAPTILER_KEY: "dummy-maptiler-key",
    },
    environmentOptions: {
      nuxt: {
        // @nuxtjs/supabase モジュールに URL/Key を渡して
        // テスト環境で Supabase プラグインが正常に初期化されるようにする
        overrides: {
          supabase: {
            url: "https://dummy.supabase.co",
            key: "dummy-anon-key",
          },
        },
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "text-summary", "html", "lcov"],
      reportsDirectory: "./coverage",
      // ユニットテストが対象とするロジック層のみ計測する。
      // .vue コンポーネントの描画は E2E（Playwright）で担保するため対象外。
      include: [
        "server/**",
        "composables/**",
        "repositories/**",
        "schemas/**",
        "lib/**",
        "middleware/**",
      ],
      exclude: ["**/*.test.ts", "**/*.config.*", "generated/**"],
      // testing.md の「ロジック層で Statements / Branches ともに 80% 以上を維持する」を
      // 機械的に担保する。下回ったら CI が落ちる値として 80 を設定している。
      // vitest 4 で v8 カバレッジの集計が AST ベースに変わり、同じテストでも数値が変わる
      // （vitest 3: Stmts 91.72% / Branch 90.03% → vitest 4: Stmts 89.92% / Branch 81.73%）。
      // Branch の余裕が小さいため、分岐を足すときはテストも同時に足す。
      thresholds: {
        statements: 80,
        branches: 80,
      },
    },
  },
});
