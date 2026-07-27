---
description: Prisma ORM 命名規約・マイグレーション・クエリ規約
globs: "front/prisma/**,front/server/utils/**"
---

# データベースルール（Prisma）

## 命名規約

- テーブル名（モデル名）: PascalCase・単数形（例: `MapCategory`, `MapSpot`）— Prisma の規約に従う
- カラム名（フィールド名）: camelCase（例: `categoryId`, `createdAt`）— Prisma の規約に従う
- DB 上のテーブル名: `@@map()` で snake_case・複数形にマッピング可（例: `@@map("map_spots")`）

## 共通フィールド

すべてのモデルに以下のフィールドを含める:

| フィールド | 型 | 説明 |
|-----------|------|------|
| id | String @id @default(uuid()) | 主キー（UUID） |
| createdAt | DateTime @default(now()) | 作成日時 |
| updatedAt | DateTime @updatedAt | 更新日時 |

操作ユーザー（`createdBy` / `updatedBy`）・論理削除（`deletedAt`）は現状のモデルでは持たない。監査要件が発生した時点で追加する（下記「監査列」の自動注入方針に従う）。

## 監査列

監査列（`createdAt` / `updatedAt` / 将来の `createdBy` / `updatedBy` / `deletedAt`）は **Prisma の機構で自動設定する**。アプリケーションコードで値を組み立てない。

- **手動代入を禁止**する。`data: { updatedAt: new Date() }` のようにハンドラー・`server/utils/` で監査列へ値を書かない（`updatedAt` の手動指定は `@updatedAt` の自動更新を上書きしてしまう）。
- 日時は **スキーマ側で宣言**する: `createdAt DateTime @default(now())` / `updatedAt DateTime @updatedAt`。
- `createdAt` は**更新しない**。`update` の `data` に `createdAt` を含めない。
- 操作ユーザー（`createdBy` / `updatedBy`）を導入する場合は、**Prisma Client Extension（`$extends` の query フック）でリクエストコンテキストから自動注入**する。各ハンドラーで個別に詰めない。
- 論理削除の `deletedAt` も同様に、削除ヘルパー（extension）経由で設定する。呼び出し側で `deletedAt: new Date()` を書かない。
- **例外**: シードデータ（`prisma/seed.ts`）・テストで日時を固定したい場合のみ明示指定を許容する。この場合も本番コードパスには持ち込まない。

## マイグレーション

- `prisma migrate dev` で開発環境のマイグレーションを管理する。
- `prisma migrate deploy` で本番環境に適用する。
- マイグレーションファイルは手動で編集しない。

## クエリ

- Prisma Client のパラメータバインディングを使用する。`$queryRaw` での文字列結合は禁止。
