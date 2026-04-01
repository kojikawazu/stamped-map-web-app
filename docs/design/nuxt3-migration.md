# Nuxt.js 3 移行設計書

## 移行理由

- 地図表示がメインの機能であり、フロントエンド比重が高い
- Vue.js / Nuxt.js 3 への習熟を目的とした個人プロジェクトとしての技術選択
- Vue.js エコシステムの設計思想を実プロジェクトで学ぶ

## 移行対象

`front/` ディレクトリ（Next.js 16 → Nuxt.js 3）

- DB・Prisma スキーマ・マイグレーション：**変更なし**
- API の仕様（エンドポイント・レスポンス形式）：**変更なし**
- Zod バリデーションスキーマ：**そのまま再利用**

---

## 技術スタック変更

| レイヤー | 移行前 | 移行後 |
|----------|--------|--------|
| フレームワーク | Next.js 16 (App Router) | Nuxt.js 3 |
| ルーティング | `app/` ディレクトリ | `pages/` ディレクトリ（ファイルベース） |
| APIサーバー | Route Handlers | Nuxt Server Routes |
| 状態管理 | React Context + useState | Vue Composable（Composition API） |
| 認証ガード | `AuthGuard` コンポーネント | Nuxt Route Middleware |
| SSR制御 | `dynamic import（ssr:false）` | `<ClientOnly>` コンポーネント |
| 地図コンポーネント | `dynamic import（ssr:false）` | `<ClientOnly>` でラップ |
| トースト通知 | sonner | vue-sonner（sonner の Vue ラッパー） |
| CSS | Tailwind CSS v4 | Tailwind CSS v4（変更なし） |
| パッケージマネージャ | pnpm | pnpm（変更なし） |
| テスト | Vitest + @testing-library/react | Vitest + @vue/test-utils + @nuxt/test-utils（**設定・テストコード全書き直し**） |

---

## ディレクトリ構成（移行後）

```
front/
├── server/
│   ├── api/
│   │   ├── categories/
│   │   │   ├── index.get.ts        ← GET  /api/categories
│   │   │   ├── index.post.ts       ← POST /api/categories
│   │   │   └── [id]/
│   │   │       ├── index.put.ts    ← PUT    /api/categories/:id
│   │   │       └── index.delete.ts ← DELETE /api/categories/:id
│   │   └── spots/
│   │       ├── index.get.ts        ← GET  /api/spots
│   │       ├── index.post.ts       ← POST /api/spots
│   │       ├── markers.get.ts      ← GET  /api/spots/markers
│   │       └── [id]/
│   │           ├── index.get.ts    ← GET    /api/spots/:id
│   │           ├── index.put.ts    ← PUT    /api/spots/:id
│   │           └── index.delete.ts ← DELETE /api/spots/:id
│   └── utils/                      ← サーバー側ユーティリティ（Nuxt が自動インポート）
│       ├── auth.ts                 ← verifyAuth()
│       ├── prisma.ts               ← Prisma クライアント
│       └── api-helpers.ts          ← レスポンス整形・エラーヘルパー（createError 統一）
├── pages/
│   ├── index.vue                   ← メイン画面（地図 + リスト）
│   └── login.vue                   ← ログイン画面
├── layouts/
│   ├── default.vue                 ← 共通レイアウト（ヘッダーあり）
│   └── empty.vue                   ← ログイン用レイアウト（ヘッダーなし）
├── middleware/
│   └── auth.ts                     ← 認証ガード（未認証 → /login）
├── composables/
│   ├── useAuth.ts                  ← 認証状態管理（@nuxtjs/supabase 利用）
│   └── useApiClient.ts             ← API クライアント（$fetch + リトライ戦略）
├── components/
│   └── map/
│       └── MapView.vue             ← MapLibre GL JS 地図コンポーネント
├── lib/
│   └── validations/
│       ├── spot.ts                 ← Zod スキーマ（再利用）
│       └── category.ts             ← Zod スキーマ（再利用）
├── prisma/                         ← front/prisma/ に配置（変更なし）
│   ├── schema.prisma
│   └── seed.ts
├── app.vue                         ← ルートコンポーネント（Toaster 配置）
├── error.vue                       ← Nuxt エラーページ（404 / 500 対応）
├── nuxt.config.ts
└── package.json
```

---

## `nuxt.config.ts` 設計

```typescript
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/supabase',
    '@tailwindcss/nuxt',  // Tailwind CSS v4 対応モジュール（@nuxtjs/tailwindcss は v3 専用のため使用不可）
    'nuxt-fonts',
  ],
  supabase: {
    url: process.env.NUXT_PUBLIC_SUPABASE_URL,
    key: process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY,
    // 独自 middleware/auth.ts で制御するため自動リダイレクトを無効化
    // ⚠️ @nuxtjs/supabase のバージョンによりオプション名が異なる場合あり（実装時に要確認）
    //   v1 系: redirect / v2 系: redirectOptions
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
})
```

> **注意**: `runtimeConfig.public` に登録しない限り `NUXT_PUBLIC_*` 変数はクライアントに渡らない。
> Supabase の URL / Anon Key は `@nuxtjs/supabase` モジュールが管理するため `runtimeConfig.public` への個別登録は不要。

---

## `@nuxtjs/supabase` モジュールの採用方針

**採用する。**

理由：
- `useSupabaseClient()`・`useSupabaseUser()`・`useSupabaseSession()` が自動インポートで使えるため、`lib/supabase.ts` が不要になる
- 設定が `nuxt.config.ts` の `supabase` セクションに集約され、クライアント管理コードが減る
- Nuxt エコシステムとの統合度が高く、学習目的にも適している

影響範囲：
- `lib/supabase.ts` は**作成しない**
- `composables/useAuth.ts` は `useSupabaseClient()` を利用して実装する
- `server/utils/auth.ts` の `verifyAuth()` はサーバー側で直接 `createClient` を使う（`@supabase/supabase-js`）

---

## コンポーネント設計の対応関係

### 認証

| 移行前（Next.js） | 移行後（Nuxt.js 3） | 変更点 |
|------------------|-------------------|--------|
| `AuthProvider` (React Context) | `composables/useAuth.ts` | `useSupabaseClient()` + `useState` で実装 |
| `AuthGuard` コンポーネント | `middleware/auth.ts` | Nuxt route middleware でリダイレクト |
| `useRouter()` (next/navigation) | `useRouter()` (Nuxt) | import 元が変わる |

### サーバー側

| 移行前（Next.js） | 移行後（Nuxt.js 3） | 変更点 |
|------------------|-------------------|--------|
| `app/api/spots/route.ts`（GET+POST） | `server/api/spots/index.get.ts` + `index.post.ts` | メソッド別にファイル分割 |
| `app/api/spots/[id]/route.ts` | `server/api/spots/[id]/index.get.ts` 等 | 同上 |
| `Response.json(...)` | `return { data: ... }` / `createError(...)` | `defineEventHandler` で return |
| `handleAuthError()` | `createError({ statusCode: 401, ... })` を throw | `server/utils/api-helpers.ts` でヘルパー化 |
| `lib/auth.ts` | `server/utils/auth.ts` | Nuxt が `server/utils/` を自動インポート |
| `lib/prisma.ts` | `server/utils/prisma.ts` | 同上 |
| `lib/api-helpers.ts` | `server/utils/api-helpers.ts` | 同上、`errorResponse` を `createError` ベースに変更 |

### フロントエンド

| 移行前（Next.js） | 移行後（Nuxt.js 3） | 変更点 |
|------------------|-------------------|--------|
| `app/page.tsx` + `app/client.tsx` | `pages/index.vue` | SFC で統合 |
| `app/login/page.tsx` + `client.tsx` | `pages/login.vue` | SFC で統合 |
| `app/layout.tsx` | `layouts/default.vue` / `layouts/empty.vue` | ページ別にレイアウト使い分け |
| `dynamic import(ssr:false)` | `<ClientOnly>` | SSR 無効化の方法が変わる |
| `useEffect` | `onMounted` / `watch` | Vue ライフサイクルへ |
| `next/font/google`（Geist フォント） | `nuxt-fonts` モジュール | フォント設定方法が変わる |

---

## Nuxt Server Routes の実装パターン

### イベントハンドラー（`defineEventHandler`）

```typescript
// server/api/spots/index.get.ts
export default defineEventHandler(async (event) => {
  await verifyAuth(event); // server/utils/auth.ts（自動インポート）

  const query = getQuery(event);
  // ... Prisma クエリ（server/utils/prisma.ts を利用）

  return { data: [...] };
});
```

### 認証ヘルパー（`server/utils/auth.ts`）

> `AuthError` クラスは不要。`createError` で直接 throw するため定義しない。

```typescript
export async function verifyAuth(event: H3Event) {
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '');
  if (!token) {
    throw createError({ statusCode: 401, message: '認証が必要です' });
  }
  const supabase = createClient(
    process.env.NUXT_PUBLIC_SUPABASE_URL!,
    process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw createError({ statusCode: 401, message: '認証が無効です' });
  }
  return user;
}
```

### Prisma クライアント（`server/utils/prisma.ts`）

開発環境の Hot Reload による接続数上限エラーを防ぐため、シングルトンパターンが必須。

```typescript
// server/utils/prisma.ts
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

### エラーヘルパー（`server/utils/api-helpers.ts`）

```typescript
// createError を利用してエラーを統一
export function notFound(message: string) {
  throw createError({ statusCode: 404, message });
}

export function badRequest(code: string, message: string, data?: unknown) {
  throw createError({ statusCode: 400, data: { code, message, ...(data && { details: data }) } });
}
```

---

## `app.vue` の実装パターン

```vue
<!-- app.vue -->
<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <Toaster rich-colors />
</template>

<script setup lang="ts">
import { Toaster } from 'vue-sonner';
</script>
```

---

## `useApiClient.ts` の実装パターン（リトライ戦略）

現行の `fetchWithRetry`（401 時にリフレッシュ → 同一リクエストを自動再実行）と同等の動作を実現する。

```typescript
// composables/useApiClient.ts
export const useApiClient = () => {
  const supabase = useSupabaseClient();

  const apiFetch = $fetch.create({
    async onRequest({ options }) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${session.access_token}`,
        };
      }
    },
    async onResponseError({ request, options, response }) {
      // _retried フラグで再試行を1回に制限し、無限ループを防ぐ
      // ⚠️ FetchOptions に _retried は存在しないため型アサーションが必要（実装時注意）
      if (response.status === 401 && !(options as Record<string, unknown>)._retried) {
        (options as Record<string, unknown>)._retried = true;
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          await navigateTo('/login');
          return;
        }
        // 新しいトークンでリクエストを再実行（現行の fetchWithRetry と同等）
        const { data: { session: newSession } } = await supabase.auth.getSession();
        if (newSession?.access_token) {
          options.headers = {
            ...options.headers,
            Authorization: `Bearer ${newSession.access_token}`,
          };
          return $fetch(request, options);
        }
      }
    },
  });

  return { apiFetch };
};
```

---

## `useAuth.ts` の実装パターン

> `onMounted` は composable 内では使用しない。plugin や middleware から呼ばれた場合に実行時エラーになるため。
> `@nuxtjs/supabase` の `useSupabaseUser()` が内部でセッション変化をリアクティブに監視するため、
> `isLoading` は `watch` で代替する。

```typescript
// composables/useAuth.ts
export const useAuth = () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();       // @nuxtjs/supabase が提供（リアクティブ）
  const session = useSupabaseSession(); // @nuxtjs/supabase が提供（リアクティブ）

  // session が undefined の間はローディング中と判定する
  // watch + immediate: true は「null でも即 false になる」論理的誤りを生むため使わない
  // ⚠️ useSupabaseSession() の初期値が undefined か null かは @nuxtjs/supabase のバージョンに依存する
  //    実装時に動作確認が必要。null から始まる場合は isLoading の代替手段を検討すること
  const isLoading = computed(() => session.value === undefined);

  // 成功時の navigateTo('/') は呼び出し側の pages/login.vue が行う
  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: 'メールアドレスまたはパスワードが正しくありません' };
    return { error: null };
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      // トースト通知
      return;
    }
    await navigateTo('/login');
  };

  return { user, session, isLoading, login, logout };
};
```

---

## `middleware/auth.ts` の実装パターン

> `useSupabaseUser()` は SSR 実行時点では `null` になるため、`import.meta.server` でガードしないと
> 認証済みユーザーでも `/login` にリダイレクトされるリダイレクトループが発生する。

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  // SSR ではスキップしクライアントサイドで再評価する
  if (import.meta.server) return;

  const user = useSupabaseUser();
  if (!user.value) {
    return navigateTo('/login');
  }
});
```

メイン画面（`pages/index.vue`）で適用：

```vue
<script setup lang="ts">
definePageMeta({ middleware: 'auth' });
</script>
```

ログイン画面（`pages/login.vue`）でレイアウト指定：

```vue
<script setup lang="ts">
// ヘッダーなしの empty レイアウトを指定
// ログイン成功後の遷移は login.vue 側で navigateTo('/') を呼ぶ
definePageMeta({ layout: 'empty' });
</script>
```

---

## テスト移行方針

現行の `src/__tests__/auth.test.tsx` は React + `@testing-library/react` 前提のため、全書き直しが必要。

### パッケージ変更

| 削除 | 追加 |
|------|------|
| `@testing-library/react` | `@vue/test-utils` |
| `@testing-library/jest-dom` | `@nuxt/test-utils` |
| `babel-plugin-react-compiler` | — |

### `vitest.config.ts` の変更

```typescript
// 移行後
import { defineVitestConfig } from '@nuxt/test-utils/config';

export default defineVitestConfig({
  test: {
    environment: 'nuxt',
  },
});
```

---

## 環境変数の変更

| 移行前 | 移行後 | 備考 |
|--------|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `NUXT_PUBLIC_SUPABASE_URL` | `@nuxtjs/supabase` が参照 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `NUXT_PUBLIC_SUPABASE_ANON_KEY` | `@nuxtjs/supabase` が参照 |
| `NEXT_PUBLIC_MAPTILER_KEY` | `NUXT_PUBLIC_MAPTILER_KEY` | `runtimeConfig.public.maptilerKey` で管理 |
| `DATABASE_URL` | `DATABASE_URL` | 変更なし |
| `DIRECT_URL` | `DIRECT_URL` | 変更なし |

---

## 実装ステップ

| # | 作業 | 内容 |
|---|------|------|
| 1 | 環境構築 | Nuxt.js 3 初期化、`@nuxtjs/supabase`・Tailwind・`nuxt-fonts` セットアップ、`nuxt.config.ts` + 環境変数設定 |
| 2 | サーバー側移植 | `server/utils/`（auth / prisma / api-helpers）+ `server/api/` 全10エンドポイント |
| 3 | 認証実装 | `composables/useAuth.ts` + `middleware/auth.ts` |
| 4 | ログイン画面 | `pages/login.vue` + `layouts/empty.vue` |
| 5 | メイン画面・地図 | `pages/index.vue` + `layouts/default.vue` + `components/map/MapView.vue` |
| 6 | エラーページ | `error.vue`（404 / 500 対応） |
| 7 | テスト移行 | `@vue/test-utils` + `@nuxt/test-utils` でテストコード書き直し |
| 8 | ドキュメント更新 | `docs/11-tasks.md`・`docs/09-architecture-specification.md` 更新 |
