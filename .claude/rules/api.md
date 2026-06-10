---
description: Nuxt.js 3 Server API 設計・サービス層分離
globs: "front/server/**"
---

# API ルール（Nuxt.js Server API）

## 設計方針

- Nuxt.js 3 の Nitro サーバーエンジンによる Server API を使用する。
- すべての DB 読み書きは Server API + Prisma 経由で行う（クライアントから直接 DB にアクセスしない）。
- 共通処理（認証・レスポンス整形・WHERE 句ビルダー等）は `server/utils/` に切り出し、ハンドラーから再利用する。
- ハンドラーが肥大化したら `server/services/` を新設してビジネスロジックを分離する（現状は未作成。ロジックはハンドラー内に記述）。

## ディレクトリ構成

```
server/
├── api/               # API エンドポイント
│   ├── categories/    # GET, POST, PUT/:id, DELETE/:id
│   ├── spots/         # GET, POST, markers, GET/:id, PUT/:id, DELETE/:id
│   └── me/            # GET /is-owner
└── utils/             # サーバーユーティリティ（auth, prisma, api-helpers）

# 将来拡張（未作成）:
#   services/          # ビジネスロジック分離先
#   middleware/        # サーバーミドルウェア（レートリミット等）
```

## 共通方針

- RESTful 設計（リソース指向エンドポイント）
- レスポンス形式: JSON
- 入力バリデーションは Server API 内で Zod を使用（400/403/404 エラー）
- API 呼び出し失敗時はフロントでトースト通知（vue-sonner）を表示する
- SQL インジェクション防止: Prisma のパラメータバインディングを使用し、文字列結合でクエリを構築しない
