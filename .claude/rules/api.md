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
- 入力バリデーションは Server API 内で Zod を使用（400/403/404 エラー）。クライアントと Server API で**同じスキーマを二重定義しない**。両方から使う検証は `schemas/` に 1 箇所定義し、双方が import する（例: `createSpotSchema` をフォームの `useSpotForm` と `POST /api/spots` が共有）。重複してよいのは検証の**実行**であって**定義**ではない
- API 呼び出し失敗時はフロントでトースト通知（vue-sonner）を表示する
- SQL インジェクション防止: Prisma のパラメータバインディングを使用し、文字列結合でクエリを構築しない

## レスポンス整形（DB エンティティを素通ししない）

- **Prisma の行オブジェクトをそのまま返さない**。公開してよいフィールドだけを列挙したレスポンス形式に変換して返す（監査列・内部用カラム・将来追加されるカラムを漏らさない）。**クライアントに届いた時点で、画面に表示していなくてもユーザーは全て閲覧できる**。
- 変換は `server/utils/api-helpers.ts` の整形関数（`formatSpotResponse` / `formatMarkerResponse` / `formatCategoryResponse`）で明示的に行う。**スプレッド（`{ ...row }`）で組み立てない** — カラムが増えた瞬間、自動的に公開される。
- Prisma 側でも取得列を絞る（`select` / `include` の対象を必要なものに限る）。**取らない・返さないの二重で絞る**のが望ましい。
- エラーレスポンスも整形する。**スタックトレース・SQL・内部メッセージをそのまま返さない**（`error-handling.md`）。
- 返す形は `types/` の API 契約の型（`Spot` / `Marker` / `Category`）と一致させ、**クライアント側で再変換しない**（変換層を二重に置かない）。表示用の整形（日付表記等）はクライアントの computed で行い、契約の型に表示都合のフィールドを足さない。
- **理由**: 過剰公開（機密漏洩）の防止、内部スキーマの変更がクライアント契約に直接漏れない疎結合化、転送量の削減。
