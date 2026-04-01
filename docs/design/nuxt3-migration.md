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
| SSR制御 | `'use client'` 指示子 | `<ClientOnly>` コンポーネント / `client:only` |
| 地図コンポーネント | `dynamic import（ssr:false）` | `<ClientOnly>` でラップ |
| トースト通知 | sonner | vue-sonner（sonner の Vue ラッパー） |
| CSS | Tailwind CSS v4 | Tailwind CSS v4（変更なし） |
| パッケージマネージャ | pnpm | pnpm（変更なし） |
| テスト | Vitest | Vitest（変更なし） |

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
│       └── api-helpers.ts          ← レスポンス整形・エラーヘルパー
├── pages/
│   ├── index.vue                   ← メイン画面（地図 + リスト）
│   └── login.vue                   ← ログイン画面
├── middleware/
│   └── auth.ts                     ← 認証ガード（未認証 → /login）
├── composables/
│   ├── useAuth.ts                  ← 認証状態管理（Composition API）
│   └── useApiClient.ts             ← API クライアント（トークンリフレッシュ含む）
├── components/
│   └── map/
│       └── MapView.vue             ← MapLibre GL JS 地図コンポーネント
├── lib/
│   ├── supabase.ts                 ← Supabase クライアント（クライアント側）
│   └── validations/
│       ├── spot.ts                 ← Zod スキーマ（再利用）
│       └── category.ts             ← Zod スキーマ（再利用）
├── prisma/                         ← 移動（front/ 配下へ）
│   ├── schema.prisma
│   └── seed.ts
├── app.vue                         ← ルートコンポーネント（Toaster 配置）
├── nuxt.config.ts
└── package.json
```

---

## コンポーネント設計の対応関係

### 認証

| 移行前（Next.js） | 移行後（Nuxt.js 3） | 変更点 |
|------------------|-------------------|--------|
| `AuthProvider` (React Context) | `composables/useAuth.ts` | `useState` + `useSupabaseClient` に置き換え |
| `AuthGuard` コンポーネント | `middleware/auth.ts` | Nuxt route middleware でリダイレクト |
| `useRouter()` | `useRouter()` | Nuxt の composable に変更 |

### サーバー側

| 移行前（Next.js） | 移行後（Nuxt.js 3） | 変更点 |
|------------------|-------------------|--------|
| `app/api/spots/route.ts`（GET+POST） | `server/api/spots/index.get.ts` + `index.post.ts` | メソッド別にファイル分割 |
| `app/api/spots/[id]/route.ts` | `server/api/spots/[id]/index.get.ts` 等 | 同上 |
| `Response.json(...)` | `$fetch` レスポンス / `createError` | Nuxt の `defineEventHandler` で `return {}` |
| `lib/auth.ts` | `server/utils/auth.ts` | Nuxt が `server/utils/` を自動インポート |
| `lib/prisma.ts` | `server/utils/prisma.ts` | 同上 |
| `lib/api-helpers.ts` | `server/utils/api-helpers.ts` | 同上 |

### フロントエンド

| 移行前（Next.js） | 移行後（Nuxt.js 3） | 変更点 |
|------------------|-------------------|--------|
| `app/page.tsx` + `app/client.tsx` | `pages/index.vue` | ファイル分離不要（SFC で統合） |
| `app/login/page.tsx` + `client.tsx` | `pages/login.vue` | 同上 |
| `dynamic import(ssr:false)` | `<ClientOnly>` コンポーネント | SSR 無効化の方法が変わる |
| `app/layout.tsx` | `app.vue` | ルートレイアウト |
| `useRouter` (next/navigation) | `useRouter` (Nuxt) | import 元が変わる |
| `useEffect` | `onMounted` / `watch` | Vue ライフサイクルへ |

---

## Nuxt Server Routes の実装パターン

```typescript
// server/api/spots/index.get.ts
export default defineEventHandler(async (event) => {
  await verifyAuth(event);  // server/utils/auth.ts（自動インポート）

  const query = getQuery(event);
  // ... Prisma クエリ（server/utils/prisma.ts を利用）

  return { data: [...] };
});
```

```typescript
// server/utils/auth.ts
export class AuthError extends Error { ... }

export async function verifyAuth(event: H3Event) {
  const token = getHeader(event, 'authorization')?.replace('Bearer ', '');
  if (!token) throw createError({ statusCode: 401, ... });
  // Supabase getUser(token) で検証
}
```

---

## 実装ステップ

| # | 作業 | ブランチ | 内容 |
|---|------|----------|------|
| 1 | 環境構築 | `feature/migrate-nuxt3` | Nuxt.js 3 初期化、Tailwind・Prisma・Supabase セットアップ |
| 2 | サーバー側移植 | 同上 | `server/utils/` + `server/api/` 全10エンドポイント |
| 3 | 認証実装 | 同上 | `composables/useAuth.ts` + `middleware/auth.ts` |
| 4 | ログイン画面 | 同上 | `pages/login.vue` |
| 5 | メイン画面・地図 | 同上 | `pages/index.vue` + `MapView.vue` |
| 6 | ドキュメント更新 | 同上 | `docs/11-tasks.md`・`docs/09-architecture-specification.md` 更新 |

---

## 注意事項

- `prisma/` ディレクトリは現在リポジトリルートの `front/prisma/` にある。Nuxt プロジェクト初期化後も同じ `front/prisma/` に配置する
- Nuxt の `server/utils/` は自動インポートされるため `@/lib/` のような import alias は不要
- MapLibre GL JS は SSR 非対応のため `<ClientOnly>` でラップ必須
- 環境変数プレフィックスは `NEXT_PUBLIC_` → `NUXT_PUBLIC_` に変更が必要
