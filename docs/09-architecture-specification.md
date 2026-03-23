# Architecture Specification (アーキテクチャ仕様書)

## システム構成図

```
┌─────────────────────────────────────────────────────────┐
│                    Client (Browser)                      │
│  Next.js + TypeScript + MapLibre GL JS                   │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ UI/Pages │  │ Map Component│  │ MapTiler Tiles   │   │
│  │ (CSR)    │  │ ('use client')│  │                  │   │
│  └──────────┘  └──────────────┘  └──────────────────┘   │
│  ┌──────────────────────────────┐                        │
│  │ Supabase Auth SDK (認証)     │                        │
│  │ signInWithPassword / getSession                       │
│  └──────────┬───────────────────┘                        │
└─────────────┼───────────────────┬────────────────────────┘
              │ JWT Bearer        │ タイルリクエスト
              ▼                   ▼
┌──────────────────────────┐  ┌───────────────────────┐
│   Next.js API Routes     │  │  MapTiler Cloud       │
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
| フロントエンド | Next.js (App Router) + TypeScript | Vercel最適、型安全 |
| 地図ライブラリ | MapLibre GL JS | MapTiler推奨、TS製、WebGL描画、ベクタータイルネイティブ対応 |
| 地図タイル | MapTiler Cloud | 無料枠100,000タイル/月、日本語地名対応、MapLibre相性◎ |
| バックエンドAPI | Next.js API Routes | Vercel一体デプロイ、追加インフラ不要 |
| ORM | Prisma | 型安全なDB操作、マイグレーション管理 |
| バリデーション | Zod | クライアント・サーバー共有スキーマ |
| データベース | Supabase (PostgreSQL + PostGIS) | 地理クエリ対応、無料枠あり |
| 認証 | Supabase Auth（クライアント側 `@supabase/supabase-js`） | JWT発行、サインアップ不要 |
| ホスティング | Vercel | Next.js最適、自動デプロイ |
| テスト | Vitest | ESM対応、Jest互換、高速 |

## 認証アーキテクチャ

### 方式：クライアント側認証（Bearer トークン）

```
クライアント側：
  - @supabase/supabase-js でログイン（signInWithPassword）
  - JWT トークンの保持・送信（SDK が自動管理）
  - 認証ガード（getSession → 未認証なら /login へリダイレクト）

サーバー側（API Routes）：
  - Authorization: Bearer <token> からJWTを取得
  - supabase.auth.getUser(token) で検証
  - 検証OK → Prisma でDB操作
```

> `@supabase/ssr` は使用しない。メイン画面が CSR 中心のため、クライアント側認証で十分。
> サインアップ機能は提供しない。アカウントは Supabase ダッシュボードで事前作成。

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
// lib/auth.ts — 全 API Route で使用する共通ヘルパー
export async function verifyAuth(request: Request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '');
  if (!token) throw new AuthError();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) throw new AuthError();
  return user;
}
```

> 全 API Route で `verifyAuth()` を呼び出す。1つでも漏れるとセキュリティホール。

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
| フロントエンド + API | Vercel | Next.js 一体デプロイ |
| データベース | Supabase | PostgreSQL + PostGIS |
| 認証 | Supabase Auth | クライアントSDK経由 |
| 地図タイル | MapTiler Cloud | CDN配信 |

## 将来の拡張パス

### バックエンド分離（必要になった場合）

```
Frontend : Vercel（そのまま）
Backend  : Go + Echo on Cloud Run
DB       : Supabase（そのまま）
```

- API を RESTful に設計しておけば、フロントは base URL を差し替えるだけで移行可能
- `api-client.ts` に API 呼び出しを集約し、移行コストを最小化
