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

## マイグレーション

- `prisma migrate dev` で開発環境のマイグレーションを管理する。
- `prisma migrate deploy` で本番環境に適用する。
- マイグレーションファイルは手動で編集しない。

## クエリ

- Prisma Client のパラメータバインディングを使用する。`$queryRaw` での文字列結合は禁止。
