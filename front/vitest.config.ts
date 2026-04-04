import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    environment: "nuxt",
    exclude: ["tests/e2e/**", "node_modules/**"],
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
  },
});
