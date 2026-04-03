# Architecture Specification (アーキテクチャ仕様書)

## システム構成図

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  Nuxt.js 3 + TypeScript + MapLibre GL JS                 │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Pages    │  │ Map Component│  │ MapTiler Tiles   │   │
│  │ (CSR)    │  │ (<ClientOnly>)│  │                  │   │
│  └──────────┘  └──────────────┘  └──────────────────┘   │
│  ┌──────────────────────────────┐                        │
│  │ @nuxtjs/supabase (認証)      │                        │
│  │ useSupabaseClient / Session  │                        │
│  └──────────┬───────────────────┘                        │
└─────────────┼───────────────────┬────────────────────────┘
              │ JWT Bearer        │ タイルリクエスト
              ▼                   ▼
┌──────────────────────────┐  ┌───────────────────────┐
│   Nuxt Server Routes     │  │  MapTiler Cloud       │
│   (Vercel Serverless)    │  │  ベクタータイル配信    │
│  ┌────────────────────┐  │  └───────────────────────┘
│  │ JWT検証             │  │
│  │ ↓                  │  │
│  │ Zod バリデーション   │  │
│  │ ↓                  │  │
│  │ Prisma ORM         │  │
│  └────────┬───────────┘  │
└───────────┼──────────────┘
            │ PostgreSQL接続 (SSL)
            ▼
┌─────────────────────────────────────────────────────────┐
│                    Supabase                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ PostgreSQL   │  │ PostGIS ext  │  │ Auth service │  │
│  │ spots        │  │ location     │  │ JWT発行      │  │
│  │ categories   │  │ GIST index   │  │              │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## 技術スタック

| レイヤー | 技術 | 選定理由 |
|----------|------|----------|
| フロントエンド | Nuxt.js 3 + TypeScript | Vue.js エコシステム、地図SPA開発に適した CSR/SSR ハイブリッド構成 |
| 地図ライブラリ | MapLibre GL JS | MapTiler推奨、TS製、WebGL描画、ベクタータイルネイティブ対応 |
| 地図タイル | MapTiler Cloud | 無料枠100,000タイル/月、日本語地名対応、MapLibre相性◎ |
| バックエンドAPI | Nuxt Server Routes (`defineEventHandler`) | Vercel一体デプロイ、追加インフラ不要 |
| ORM | Prisma + `@prisma/adapter-pg` | 型安全なDB操作、PostgreSQL アダプター経由接続 |
| バリデーション | Zod | クライアント・サーバー共有スキーマ |
| データベース | Supabase (PostgreSQL + PostGIS) | 地理クエリ対応、無料枠あり |
| 認証 | Supabase Auth（`@nuxtjs/supabase`） | JWT発行、`useSupabaseClient/User/Session` auto-import |
| ホスティング | Vercel | Nuxt.js 対応、自動デプロイ |
| テスト | Vitest + `@nuxt/test-utils` + `@vue/test-utils` | ESM対応、Nuxt環境テスト |

## 認証アーキテクチャ

### 方式：クライアント側認証（Bearer トークン）

```
クライアント側：
  - @nuxtjs/supabase の useSupabaseClient() でログイン（signInWithPassword）
  - useApiClient composable が Authorization: Bearer <token> を自動付与
  - 401 時はトークンリフレッシュ → 1回リトライ（try/catch ラッパー）
  - middleware/auth.ts で未認証なら /login へリダイレクト（クライアントサイドのみ）

サーバー側（Server Routes）：
  - Authorization: Bearer <token> からJWTを取得
  - supabase.auth.getUser(token) で検証（singleton クライアント使用）
  - 検証OK → Prisma でDB操作
```

> `@nuxtjs/supabase` の `serverSupabaseClient` はCookieセッション前提のため使用しない。
> Bearer トークン方式を採用することでフロント・APIの認証方式を統一。
> サインアップ機能は提供しない。アカウントは Supabase ダッシュボードで事前作成。

### SSR ガードの設計

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware(() => {
  if (import.meta.server) return; // SSR ではスキップ（useSupabaseUser が null になるため）
  const user = useSupabaseUser();
  if (!user.value) return navigateTo("/login");
});
```

> 初回 SSR レスポンスは認証なしで返るが、クライアントハイドレーション後に即座にガードが発動する。
> 地図SPA の特性上（全ページ要認証）、この設計で十分。

## ディレクトリ構成（`front/`）

```
front/
├── app.vue                    # ルートレイアウト（NuxtLayout + Toaster）
├── nuxt.config.ts             # Nuxt設定
├── assets/css/main.css        # Tailwind CSS v4 エントリーポイント
├── pages/
│   ├── index.vue              # メイン画面（地図、auth middleware 適用）
│   └── login.vue              # ログイン画面（empty layout）
├── layouts/
│   ├── default.vue            # ヘッダー付きレイアウト
│   └── empty.vue              # ログイン用シンプルレイアウト
├── components/
│   ├── map/MapView.vue        # MapLibre GL JS（<ClientOnly> でSSR除外）、GeoJSONマーカー描画
│   └── spot/
│       ├── SpotPanel.vue      # 左パネルコンテナ（検索・一覧・ページネーション）
│       ├── SpotFilter.vue     # 検索・ソート・カテゴリフィルターUI
│       ├── SpotList.vue       # スポット一覧（ローディング・空状態含む）
│       ├── SpotListItem.vue   # スポット1件（カテゴリ色バッジ付き）
│       └── SpotPagination.vue # ページネーションUI
├── composables/
│   ├── useAuth.ts             # Supabase セッション管理・ログイン・ログアウト
│   ├── useApiClient.ts        # $fetch ラッパー（Bearer token + 401 リトライ）
│   ├── useSpotFilter.ts       # フィルター・ソート・ページ状態の一元管理（useState共有）
│   ├── useSpots.ts            # スポット一覧取得（ページネーション付き）
│   ├── useMarkers.ts          # マーカーデータ取得（全件・軽量）
│   └── useCategories.ts       # カテゴリ一覧取得
├── types/
│   ├── spot.ts                # Spot / Pagination / SpotsResponse 型
│   ├── marker.ts              # Marker / MarkersResponse 型
│   └── category.ts            # Category / CategoriesResponse 型
├── middleware/
│   └── auth.ts                # 認証ガード（クライアントサイドのみ）
├── server/
│   ├── utils/
│   │   ├── auth.ts            # verifyAuth（Bearer JWT検証）
│   │   ├── prisma.ts          # Prisma singleton（globalThis）
│   │   └── api-helpers.ts     # レスポンス整形・WHERE句ビルダー・バリデーション
│   └── api/
│       ├── categories/        # GET, POST, PUT/:id, DELETE/:id
│       └── spots/             # GET, POST, GET/markers, GET/:id, PUT/:id, DELETE/:id
├── lib/
│   └── validations/
│       ├── spot.ts            # Zod スキーマ（スポット）
│       └── category.ts        # Zod スキーマ（カテゴリ）
├── __tests__/
│   ├── server/utils/          # api-helpers ユニットテスト
│   └── lib/validations/       # Zod バリデーションテスト
└── prisma/
    ├── schema.prisma
    └── seed.ts
```

## データアクセス層

### Spot の永続化方式

```
latitude (Float) ──┐
                   ├── location (geography) ← 生成カラム（自動算出）
longitude (Float) ─┘

通常CRUD：Prisma 型安全API（latitude, longitude を直接読み書き）
空間検索：$queryRaw で location 生成カラムのGISTインデックスを利用
```

> `Unsupported` 型を使わず、lat/lng を通常カラムにすることで Prisma の型安全性を最大限活用。
> 生成カラムと GIST インデックスは Prisma スキーマで表現不可のため、SQL migration で管理する。

### JWT 検証の共通化

```typescript
// server/utils/auth.ts — 全 Server Route で使用する共通ヘルパー
// Supabase クライアントは singleton でモジュールレベルに保持（per-request 生成を避ける）
let _supabaseAdmin: SupabaseClient | null = null;

export async function verifyAuth(event: H3Event) {
  const token = getHeader(event, "authorization")?.replace("Bearer ", "");
  if (!token) throw createError({ statusCode: 401, message: "認証が必要です" });
  const { data: { user }, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !user) throw createError({ statusCode: 401, message: "認証が無効です" });
  return user;
}
```

> 全 Server Route で `verifyAuth()` を呼び出す。1つでも漏れるとセキュリティホール。

### DB制約・インデックス

| 対象 | 制約/インデックス |
|------|-----------------|
| categories.name | UNIQUE |
| spots.category_id | INDEX |
| spots.visited_at | INDEX |
| spots.created_at | INDEX |
| spots.location | GIST INDEX（生成カラム） |

## 地図タイル

### MapTiler Cloud

| 項目 | 値 |
|------|-----|
| 無料枠 | 100,000タイル/月 |
| 個人利用（月300回表示） | 約6,000タイル消費 → 余裕 |
| タイル形式 | ベクタータイル（MapLibreでネイティブ描画） |

## デプロイ構成

| 環境 | ホスト | 内容 |
|------|--------|------|
| フロントエンド + API | Vercel | Nuxt.js 一体デプロイ |
| データベース | Supabase | PostgreSQL + PostGIS |
| 認証 | Supabase Auth | `@nuxtjs/supabase` 経由 |
| 地図タイル | MapTiler Cloud | CDN配信 |

## 将来の拡張パス

### バックエンド分離（必要になった場合）

```
Frontend : Vercel（そのまま）
Backend  : Go + Echo on Cloud Run
DB       : Supabase（そのまま）
```

- API を RESTful に設計しておけば、フロントは base URL を差し替えるだけで移行可能
- `useApiClient.ts` に API 呼び出しを集約し、移行コストを最小化

### コンポーネント設計の拡張

現状は `components/` フラット構成。UIが複雑化した際はアトミックデザイン階層への移行を予定。
（Issue #7 参照）
