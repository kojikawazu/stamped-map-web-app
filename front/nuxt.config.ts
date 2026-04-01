import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: "2025-04-01",
  devtools: { enabled: true },

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
    databaseUrl: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
    // クライアントに公開する変数（NUXT_PUBLIC_ プレフィックスで上書き可）
    public: {
      maptilerKey: process.env.NUXT_PUBLIC_MAPTILER_KEY,
    },
  },
});
