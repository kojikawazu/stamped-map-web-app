# Data Specification (データ仕様書)

## Prisma スキーマ

```prisma
generator client {
  provider        = "prisma-client-js"
  previewFeatures = ["postgresqlExtensions"]
}

datasource db {
  provider   = "postgresql"
  url        = env("DATABASE_URL")
  directUrl  = env("DIRECT_URL")
  extensions = [postgis]
}

model Category {
  id        String   @id @default(uuid())
  name      String   @unique
  color     String   @default("#6B7280")
  isDefault Boolean  @default(false) @map("is_default")
  sortOrder Int      @default(0) @map("sort_order")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")
  spots     Spot[]

  @@map("categories")
}

model Spot {
  id         String   @id @default(uuid())
  name       String
  categoryId String   @map("category_id")
  category   Category @relation(fields: [categoryId], references: [id])
  latitude   Float
  longitude  Float
  visitedAt  DateTime @map("visited_at") @db.Date
  memo       String?
  imageUrl   String?  @map("image_url")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@index([categoryId])
  @@index([visitedAt])
  @@index([createdAt])
  @@map("spots")
}
```

### マイグレーション追加SQL（PostGIS 空間インデックス用）

> **重要：** 生成カラムと GIST インデックスは Prisma スキーマだけでは定義できない。
> 以下の SQL を Prisma migration に手動追加する（`prisma/migrations/xxx/migration.sql`）。

```sql
-- PostGIS 拡張の有効化
CREATE EXTENSION IF NOT EXISTS postgis;

-- 空間検索用の geography 生成カラムとGISTインデックス
ALTER TABLE spots
  ADD COLUMN location geography(Point, 4326)
  GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
  ) STORED;

CREATE INDEX spots_location_gist ON spots USING GIST (location);
```

> `latitude` / `longitude` は通常の Float カラムとして Prisma で型安全に読み書き。
> `location` は生成カラムとして自動算出され、空間検索用インデックスの対象となる。
> Prisma の `prisma migrate dev` 実行後、生成された migration ファイルに上記 SQL を追記する運用。

## テーブル詳細

### categories テーブル

| カラム | 型 | 必須 | 制約 | 説明 |
|--------|----|------|------|------|
| id | uuid (PK) | ○ | | 自動生成 |
| name | text | ○ | **UNIQUE** | カテゴリ名 |
| color | text | ○ | | マーカー色（HEXカラーコード） |
| is_default | boolean | ○ | | デフォルトカテゴリか否か |
| sort_order | int | ○ | | 表示順 |
| created_at | timestamptz | ○ | | 作成日時（自動） |
| updated_at | timestamptz | ○ | | 更新日時（自動） |

### デフォルトカテゴリ（シードデータ）

| name | color | sort_order |
|------|-------|------------|
| 食事 | #EF4444 | 1 |
| 自然 | #22C55E | 2 |
| 観光 | #3B82F6 | 3 |
| ショッピング | #A855F7 | 4 |
| その他 | #6B7280 | 5 |

### spots テーブル

| カラム | 型 | 必須 | 制約 | 説明 |
|--------|----|------|------|------|
| id | uuid (PK) | ○ | | 自動生成 |
| name | text | ○ | | スポット名 |
| category_id | uuid (FK) | ○ | INDEX | カテゴリID → categories.id |
| latitude | float8 | ○ | | 緯度（-90〜90） |
| longitude | float8 | ○ | | 経度（-180〜180） |
| location | geography(Point, 4326) | ○ | GIST INDEX | 生成カラム（lat/lngから自動算出） |
| visited_at | date | ○ | INDEX | 訪問日 |
| memo | text | - | | メモ |
| image_url | text | - | | 写真URL（Phase 2） |
| created_at | timestamptz | ○ | INDEX | 作成日時（自動） |
| updated_at | timestamptz | ○ | | 更新日時（自動） |

## ER図

```
[categories] 1 ──── * [spots]
  id (PK)                id (PK)
  name (UNIQUE)          name
  color                  category_id (FK, INDEX)
  is_default             latitude
  sort_order             longitude
  created_at             location (GENERATED, GIST INDEX)
  updated_at             visited_at (INDEX)
                         memo
                         image_url (Phase 2)
                         created_at (INDEX)
                         updated_at
```

## データ操作

### Prisma 通常API（型安全CRUD）

```typescript
// スポット一覧取得
const spots = await prisma.spot.findMany({
  include: { category: true },
  orderBy: { visitedAt: 'desc' },
  skip: (page - 1) * limit,
  take: limit,
});

// スポット登録
const spot = await prisma.spot.create({
  data: {
    name, categoryId, latitude, longitude, visitedAt, memo,
  },
  include: { category: true },
});

// スポット更新
const spot = await prisma.spot.update({
  where: { id },
  data: { name, categoryId, latitude, longitude, visitedAt, memo },
  include: { category: true },
});

// スポット削除
await prisma.spot.delete({ where: { id } });

// 名前検索
const spots = await prisma.spot.findMany({
  where: { name: { contains: query, mode: 'insensitive' } },
  include: { category: true },
});

// カテゴリフィルター
const spots = await prisma.spot.findMany({
  where: { categoryId: { in: categoryIds } },
  include: { category: true },
});
```

### 空間クエリ（$queryRaw — 将来の拡張用）

```typescript
// 半径1km以内のスポット取得（location 生成カラムを利用）
const nearby = await prisma.$queryRaw`
  SELECT id, name, latitude, longitude
  FROM spots
  WHERE ST_DWithin(
    location,
    ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
    ${radius}
  )
`;
```

## クライアント側データ保存（localStorage）

| キー | 値 | 用途 |
|------|-----|------|
| `map_center` | `[lng, lat]` | 地図の最後の中心座標 |
| `map_zoom` | `number` | 地図の最後のズームレベル |

## データフロー

```
【登録フロー】
ユーザー（地図クリック → モーダル入力）
  ↓ POST /api/spots + JWT
API Routes（JWT検証）
  ↓ Prisma spot.create({ latitude, longitude, ... })
  ↓ location 生成カラムが自動算出
Supabase PostgreSQL + PostGIS
  ↓ 成功レスポンス
クライアント → 地図にマーカー追加 + リスト更新

【一覧取得フロー】
クライアント
  ↓ GET /api/spots?sort=visited_at&order=desc&category=xxx&page=1&q=キーワード + JWT
API Routes（JWT検証）
  ↓ Prisma spot.findMany({ where, orderBy, skip, take, include })
Supabase PostgreSQL
  ↓ JSON レスポンス（spots[] + pagination info）
クライアント → リスト描画 + MapLibre でマーカー描画

【マーカー一括取得フロー】
クライアント
  ↓ GET /api/spots/markers + JWT
API Routes（JWT検証）
  ↓ Prisma spot.findMany({ select: { id, name, latitude, longitude, categoryId }, include: { category: { select: { color } } } })
Supabase PostgreSQL
  ↓ JSON レスポンス（id, name, latitude, longitude, categoryId, categoryColor）
クライアント → MapLibre で全マーカー描画（ポップアップに name 使用）

【カテゴリ管理フロー】
クライアント
  ↓ GET/POST /api/categories + JWT
API Routes（JWT検証）
  ↓ Prisma category.findMany / category.create
Supabase PostgreSQL
  ↓ JSON レスポンス
クライアント → カテゴリプルダウン更新
```
