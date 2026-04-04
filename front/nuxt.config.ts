import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-04-01",
  devtools: { enabled: true },

  // アトミックデザイン階層（atoms/molecules/organisms）を使いつつ、
  // コンポーネント名はディレクトリ名を含まない形（例: SpotPanel）で自動登録する
  components: {
    dirs: [
      { path: "~/components", pathPrefix: false },
    ],
  },

  modules: [
    "@nuxtjs/supabase",
    "@nuxt/fonts",
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  css: ["~/assets/css/main.css"],

  supabase: {
    // 独自 middleware/auth.ts で認証制御するため自動リダイレクトを無効化
    // ⚠️ @nuxtjs/supabase のバージョンによりオプション名が異なる場合あり
    //   v1 系: redirect / v2 系: redirectOptions（実装時に要確認）
    redirect: false,
  },

  runtimeConfig: {
    // サーバー側のみ（クライアントに公開しない）
    // 対応する環境変数（NUXT_DATABASE_URL, NUXT_DIRECT_URL）で実行時に上書きされる
    databaseUrl: "",
    directUrl: "",
    // クライアントに公開する変数（NUXT_PUBLIC_MAPTILER_KEY で実行時に上書きされる）
    public: {
      maptilerKey: "",
      siteUrl: "",
    },
  },
});
