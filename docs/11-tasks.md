# Task List (タスク)

## マイルストーン

| # | マイルストーン | 内容 | 状態 |
|---|---------------|------|------|
| M1 | 環境構築 | プロジェクトセットアップ、外部サービス準備、接続確認 | 完了 |
| M2 | 認証 | Supabase Auth でログイン、認証ガード | 完了 |
| M0 | Nuxt.js 3 移行 | フロントエンドを Next.js 16 から Nuxt.js 3 へ移行 | 完了 |
| M3 | 地図表示 | Nuxt.js 3 + MapLibre GL JS で地図表示 + マーカー描画 | 未着手 |
| M4 | CRUD実装 | スポットの登録・一覧・詳細・編集・削除（Server Routes + Prisma） | 進行中 |
| M5 | 地図連携 | 地図クリック→登録、クラスタリング、カテゴリアイコン | 未着手 |
| M6 | 拡張機能 | ヒートマップ、統計、タイムラインなど | 未着手 |

## M1: 環境構築（完了）

- [x] Next.js + TypeScript プロジェクト作成（`front/` ディレクトリ）
- [x] パッケージマネージャーを pnpm に移行
- [x] MapTiler Cloud アカウント作成・API key発行
- [x] Supabase プロジェクト作成・PostGIS有効化
- [x] Prisma セットアップ・DB接続確認（PGアダプター、スキーマ定義、シードスクリプト）
- [x] MapLibre GL JS 接続確認（地図表示 + 位置記憶）
- [x] 環境変数設定（`.env.example` 作成）
- [x] 基盤ライブラリ実装
  - [x] Supabase クライアント（`lib/supabase.ts`）
  - [x] Prisma クライアント（`lib/prisma.ts`）
  - [x] 認証ヘルパー（`lib/auth.ts` — `verifyAuth()` + `handleAuthError()`）
  - [x] API クライアント（`lib/api-client.ts` — spots/categories CRUD + トークンリフレッシュ）
  - [x] Zod バリデーションスキーマ（`lib/validations/spot.ts`, `category.ts`）
- [x] 基本レイアウト（ヘッダー + サイドバー + 地図の3カラム構成）
- [ ] Vercel プロジェクト作成・デプロイ確認

## M2: 認証（完了）

- [x] ログイン画面（`/login`）の実装
  - [x] メールアドレス・パスワード入力フォーム
  - [x] Supabase Auth `signInWithPassword` でログイン処理
  - [x] 認証エラーメッセージ表示（インライン + Sonner トースト）
  - [x] 認証済みの場合は `/` にリダイレクト
- [x] 認証ガード（`AuthGuard` コンポーネント）の実装
  - [x] メイン画面ロード時にローディングシェル表示（スピナー）
  - [x] `getSession()` + `onAuthStateChange()` で認証状態を判定
  - [x] 未認証 → `/login` にクライアント側リダイレクト
- [x] ログアウト機能
  - [x] ヘッダーにログアウトボタン追加
  - [x] セッション破棄 → ログイン画面にリダイレクト
- [x] `useAuth` カスタムフック（セッション管理・ログイン・ログアウト）
- [x] メインページ `page.tsx` / `client.tsx` 分離（設計方針準拠）
- [x] Sonner `<Toaster>` をルートレイアウトに追加
- [x] 認証ページを `force-dynamic` に設定（プリレンダリング回避）

### M2 追加: Google OAuth認証（進行中）

手動作業（実装前に完了が必要）:
- [ ] Google Cloud Console で OAuth 2.0 クライアントID 作成（承認済みリダイレクト URI に `https://[project-ref].supabase.co/auth/v1/callback` を追加）
- [ ] Supabase ダッシュボード → Authentication → Providers → Google 有効化

コード実装:
- [x] `nuxt.config.ts` に `siteUrl` runtimeConfig 追加
- [x] `composables/useAuth.ts` に `loginWithGoogle()` 追加
- [x] `pages/login.vue` に Google ログインボタン・区切り線追加
- [x] `.env` / `.env.example` に `NUXT_PUBLIC_SITE_URL` 追加

## M4: CRUD実装（進行中）

### API Routes（完了）
- [x] 共通ヘルパー（`lib/api-helpers.ts` — レスポンス整形、バリデーションエラー変換、WHERE句ビルダー）
- [x] `GET /api/categories` — カテゴリ一覧（spotCount付き）
- [x] `POST /api/categories` — カテゴリ追加（重複チェック付き）
- [x] `PUT /api/categories/:id` — カテゴリ更新（重複チェック付き）
- [x] `DELETE /api/categories/:id` — カテゴリ削除（デフォルト・使用中ガード）
- [x] `GET /api/spots` — スポット一覧（ページネーション、ソート、カテゴリフィルター、名前検索）
- [x] `POST /api/spots` — スポット登録（カテゴリ存在チェック付き）
- [x] `GET /api/spots/markers` — マーカー用軽量データ（全件、フィルター対応）
- [x] `GET /api/spots/:id` — スポット詳細
- [x] `PUT /api/spots/:id` — スポット更新
- [x] `DELETE /api/spots/:id` — スポット削除

### フロントエンドUI（進行中）
- [x] スポット一覧（左パネル）— SpotPanel / SpotList / SpotListItem / SpotFilter / SpotPagination
- [x] スポット登録モーダル
- [ ] スポット詳細表示
- [ ] スポット編集モーダル
- [ ] スポット削除（確認ダイアログ）
- [ ] カテゴリ管理UI

## M0: Nuxt.js 3 移行（完了）

- [x] 設計書作成・レビュー（`docs/design/nuxt3-migration.md`）
- [x] `front/` を Nuxt.js 3 で再構築（Next.js ファイル削除）
- [x] `package.json` / `nuxt.config.ts` / `tsconfig.json` 作成
- [x] `server/utils/`（auth / prisma / api-helpers）移植
- [x] `server/api/` 全10エンドポイント移植（Server Routes）
- [x] `composables/useAuth.ts` + `middleware/auth.ts` 実装
- [x] `pages/login.vue` + `layouts/empty.vue` 実装
- [x] `pages/index.vue` + `layouts/default.vue` + `MapView.vue` 実装
- [x] `error.vue` 実装
- [x] 環境変数プレフィックス `NEXT_PUBLIC_` → `NUXT_PUBLIC_` 更新
- [x] テスト移行（`@vue/test-utils` + `@nuxt/test-utils`）
- [x] `docs/09-architecture-specification.md` 更新

## 次のアクション（M3: 地図表示）

- [x] 地図マーカー描画（カテゴリ色で表示）— GeoJSON Source + Circle Layer
- [x] マーカークリックでポップアップ表示（名前・カテゴリ名）
- [ ] マーカークラスタリング（MapLibre GeoJSON cluster）

## 進捗

| 日付 | 内容 |
|------|------|
| 2026-03-23 | M1: プロジェクト初期構築（Next.js + Prisma + MapLibre + Supabase Auth 基盤） |
| 2026-03-23 | M1: pnpm 移行、front/ ディレクトリへのリファクタリング |
| 2026-03-24 | M1: タスクファイル更新、進捗を実態に合わせて反映 |
| 2026-03-24 | M2: ログイン画面、認証ガード、ログアウト、useAuthフック実装 |
| 2026-03-24 | Prisma スキーマを実DB（map_categories, map_spots）に同期 |
| 2026-03-24 | M4: API Routes 全10エンドポイント実装（Categories CRUD + Spots CRUD + markers） |
