---
description: Nuxt.js 3 Server API 設計・サービス層分離
globs: "front/server/**"
---

# API ルール（Nuxt.js Server API）

## 設計方針

- Nuxt.js 3 の Nitro サーバーエンジンによる Server API を使用する。
- ビジネスロジックは `server/services/` に集約し、API ハンドラーは薄く保つ。
- すべての DB 読み書きは Server API + Prisma 経由で行う（クライアントから直接 DB にアクセスしない）。

## ディレクトリ構成

```
server/
├── api/               # API エンドポイント
│   ├── categories/
│   ├── spots/
│   └── me/
├── services/          # ビジネスロジック（将来的に分離推奨）
├── middleware/         # サーバーミドルウェア
└── utils/             # サーバーユーティリティ（auth, api-helpers 等）
```

## 共通方針

- RESTful 設計（リソース指向エンドポイント）
- レスポンス形式: JSON
- 入力バリデーションは Server API 内で Zod を使用（400/403/404 エラー）
- API 呼び出し失敗時はフロントでトースト通知（vue-sonner）を表示する
- SQL インジェクション防止: Prisma のパラメータバインディングを使用し、文字列結合でクエリを構築しない
