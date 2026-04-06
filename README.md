# Stamped Map Web App

訪問済みスポットをデータとして記録し、地図上で可視化する個人Webアプリ。

## Tech Stack

| レイヤー | 技術 |
|----------|------|
| フロントエンド | Nuxt.js 3 + TypeScript + Tailwind CSS v4 |
| 地図 | MapLibre GL JS + MapTiler Cloud |
| API | Nuxt Server Routes (Vercel Serverless) |
| ORM | Prisma + `@prisma/adapter-pg` |
| データベース | Supabase (PostgreSQL + PostGIS) |
| 認証 | Supabase Auth (`@nuxtjs/supabase`) |
| ホスティング | Vercel |

## Setup

### 前提条件

- Node.js 18+
- pnpm 10+
- Supabase プロジェクト（PostgreSQL + PostGIS 有効化済み）
- MapTiler Cloud アカウント（API Key 発行済み）

### 1. 依存パッケージのインストール

```bash
cd front
pnpm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を編集して各値を設定する：

| 変数 | 説明 |
|------|------|
| `SUPABASE_URL` | Supabase プロジェクト URL |
| `SUPABASE_KEY` | Supabase Anon Key |
| `DATABASE_URL` | Supabase 接続文字列（プーリング） |
| `DIRECT_URL` | Supabase 直接接続（Prisma Migrate 用） |
| `NUXT_PUBLIC_MAPTILER_KEY` | MapTiler API Key |
| `NUXT_PUBLIC_SITE_URL` | サイト URL（Google OAuth リダイレクト先） |
| `ALLOWED_EMAILS` | Write操作を許可するメールアドレス（カンマ区切り） |

### 3. データベースのセットアップ

```bash
cd front

# Prisma クライアント生成 + マイグレーション
pnpm exec prisma migrate dev

# シードデータ投入（デフォルトカテゴリ）
pnpm db:seed
```

### 4. ユーザーアカウントの作成

サインアップ機能は提供していない。Supabase ダッシュボード → Authentication → Users → **Add user** で手動作成する。

### 5. 開発サーバーの起動

```bash
cd front
pnpm dev
```

http://localhost:3000 でアクセスできる。

## Commands

> すべてのコマンドは `front/` ディレクトリで実行する。

```bash
cd front

# 開発サーバー起動
pnpm dev

# ビルド
pnpm build

# ユニットテスト
pnpm test

# E2E テスト
pnpm test:e2e

# Lint
pnpm lint
```

## Architecture

詳細は `docs/09-architecture-specification.md` を参照。

```
Browser (Nuxt.js 3 + MapLibre GL JS)
  │ Bearer JWT
  ▼
Nuxt Server Routes (Vercel Serverless)
  │ Prisma ORM
  ▼
Supabase (PostgreSQL + PostGIS)
```
