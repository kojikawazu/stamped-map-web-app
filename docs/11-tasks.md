# Task List (タスク)

## マイルストーン

| # | マイルストーン | 内容 | 状態 |
|---|---------------|------|------|
| M1 | 環境構築 | プロジェクトセットアップ、外部サービス準備、接続確認 | 完了 |
| M2 | 認証 | Supabase Auth でログイン、認証ガード | 完了 |
| M3 | 地図表示 | Next.js + MapLibre GL JS で地図表示 + マーカー描画 | 未着手 |
| M4 | CRUD実装 | スポットの登録・一覧・詳細・編集・削除（API Routes + Prisma） | 未着手 |
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

## 次のアクション（M3: 地図表示）

- [ ] API Routes: `GET /api/spots/markers`（マーカー用軽量データ）
- [ ] 地図マーカー描画（カテゴリ色で表示）
- [ ] マーカークリックでポップアップ表示（名前・カテゴリ・訪問日）
- [ ] マーカークラスタリング（MapLibre GeoJSON cluster）

## 進捗

| 日付 | 内容 |
|------|------|
| 2026-03-23 | M1: プロジェクト初期構築（Next.js + Prisma + MapLibre + Supabase Auth 基盤） |
| 2026-03-23 | M1: pnpm 移行、front/ ディレクトリへのリファクタリング |
| 2026-03-24 | M1: タスクファイル更新、進捗を実態に合わせて反映 |
| 2026-03-24 | M2: ログイン画面、認証ガード、ログアウト、useAuthフック実装 |
