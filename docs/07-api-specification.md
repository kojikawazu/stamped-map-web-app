# API Specification (API仕様書)

## 概要

- ベースパス: `/api`
- 形式: REST API（JSON）
- 認証: `Authorization: Bearer <JWT>` ヘッダー（全エンドポイント必須）

## エンドポイント一覧

| メソッド | パス | 説明 | 認証 |
|----------|------|------|------|
| GET | `/api/spots` | スポット一覧取得（ページネーション付き） | 必須 |
| GET | `/api/spots/markers` | 地図マーカー用の軽量データ全件取得 | 必須 |
| GET | `/api/spots/:id` | スポット詳細取得 | 必須 |
| POST | `/api/spots` | スポット登録 | 必須 |
| PUT | `/api/spots/:id` | スポット更新 | 必須 |
| DELETE | `/api/spots/:id` | スポット削除 | 必須 |
| GET | `/api/categories` | カテゴリ一覧取得 | 必須 |
| POST | `/api/categories` | カテゴリ追加 | 必須 |
| PUT | `/api/categories/:id` | カテゴリ更新 | 必須 |
| DELETE | `/api/categories/:id` | カテゴリ削除 | 必須 |

## Spots API

### GET /api/spots — スポット一覧取得

**クエリパラメータ:**

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| `page` | number | - | 1 | ページ番号 |
| `limit` | number | - | 20 | 1ページあたりの件数（最大100） |
| `sort` | string | - | `visited_at` | ソート対象（`visited_at` / `created_at`） |
| `order` | string | - | `desc` | ソート順（`asc` / `desc`） |
| `category` | string | - | - | カテゴリIDで絞り込み（カンマ区切りで複数指定可） |
| `q` | string | - | - | スポット名の部分一致検索（大文字小文字区別なし） |

**レスポンス: 200 OK**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "東京タワー",
      "category": {
        "id": "uuid",
        "name": "観光",
        "color": "#3B82F6"
      },
      "latitude": 35.6586,
      "longitude": 139.7454,
      "visitedAt": "2026-03-23",
      "memo": "展望台からの景色が最高",
      "imageUrl": null,
      "createdAt": "2026-03-23T10:00:00Z",
      "updatedAt": "2026-03-23T10:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3
  }
}
```

### GET /api/spots/markers — 地図マーカー用データ取得

地図上の全マーカー描画専用の軽量エンドポイント。ページネーションなし、全件返却。

**クエリパラメータ:**

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| `category` | string | - | カテゴリIDで絞り込み（カンマ区切り） |
| `q` | string | - | スポット名の部分一致検索 |

> フィルター・検索の条件は一覧と同期させるため、同じパラメータを受け付ける。

**レスポンス: 200 OK**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "東京タワー",
      "latitude": 35.6586,
      "longitude": 139.7454,
      "categoryId": "uuid",
      "categoryColor": "#3B82F6"
    }
  ]
}
```

### GET /api/spots/:id — スポット詳細取得

**レスポンス: 200 OK**

```json
{
  "data": {
    "id": "uuid",
    "name": "東京タワー",
    "category": {
      "id": "uuid",
      "name": "観光",
      "color": "#3B82F6"
    },
    "latitude": 35.6586,
    "longitude": 139.7454,
    "visitedAt": "2026-03-23",
    "memo": "展望台からの景色が最高",
    "imageUrl": null,
    "createdAt": "2026-03-23T10:00:00Z",
    "updatedAt": "2026-03-23T10:00:00Z"
  }
}
```

### POST /api/spots — スポット登録

**リクエストボディ:**

```json
{
  "name": "東京タワー",
  "categoryId": "uuid",
  "latitude": 35.6586,
  "longitude": 139.7454,
  "visitedAt": "2026-03-23",
  "memo": "展望台からの景色が最高"
}
```

| フィールド | 型 | 必須 | バリデーション |
|-----------|-----|------|---------------|
| `name` | string | ○ | 1〜100文字 |
| `categoryId` | string | ○ | 有効な category UUID |
| `latitude` | number | ○ | -90〜90 |
| `longitude` | number | ○ | -180〜180 |
| `visitedAt` | string (date) | ○ | YYYY-MM-DD、未来日不可 |
| `memo` | string | - | 最大1000文字 |

**レスポンス: 201 Created**

```json
{
  "data": {
    "id": "uuid",
    "name": "東京タワー",
    "category": {
      "id": "uuid",
      "name": "観光",
      "color": "#3B82F6"
    },
    "latitude": 35.6586,
    "longitude": 139.7454,
    "visitedAt": "2026-03-23",
    "memo": "展望台からの景色が最高",
    "imageUrl": null,
    "createdAt": "2026-03-23T10:00:00Z",
    "updatedAt": "2026-03-23T10:00:00Z"
  }
}
```

### PUT /api/spots/:id — スポット更新

**リクエストボディ:** POST と同一形式。バリデーションも同一。

**レスポンス: 200 OK**

```json
{
  "data": { ... }
}
```

### DELETE /api/spots/:id — スポット削除

**レスポンス: 200 OK**

```json
{
  "data": {
    "id": "uuid",
    "message": "Spot deleted successfully"
  }
}
```

## Categories API

### GET /api/categories — カテゴリ一覧取得

**レスポンス: 200 OK**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "食事",
      "color": "#EF4444",
      "isDefault": true,
      "sortOrder": 1,
      "spotCount": 12
    },
    {
      "id": "uuid",
      "name": "自然",
      "color": "#22C55E",
      "isDefault": true,
      "sortOrder": 2,
      "spotCount": 5
    }
  ]
}
```

> `spotCount` は各カテゴリに紐づくスポット数。フィルターUIでの件数表示に使用。

### POST /api/categories — カテゴリ追加

**リクエストボディ:**

```json
{
  "name": "温泉",
  "color": "#F59E0B"
}
```

| フィールド | 型 | 必須 | バリデーション |
|-----------|-----|------|---------------|
| `name` | string | ○ | 1〜50文字、既存名と重複不可 |
| `color` | string | ○ | 有効なHEXカラーコード（#RRGGBB） |

**レスポンス: 201 Created**

```json
{
  "data": {
    "id": "uuid",
    "name": "温泉",
    "color": "#F59E0B",
    "isDefault": false,
    "sortOrder": 6,
    "spotCount": 0
  }
}
```

### PUT /api/categories/:id — カテゴリ更新

**リクエストボディ:**

```json
{
  "name": "温泉♨",
  "color": "#F97316"
}
```

バリデーションは POST と同一。デフォルトカテゴリも更新可能。

**レスポンス: 200 OK**

```json
{
  "data": { ... }
}
```

### DELETE /api/categories/:id — カテゴリ削除

- デフォルトカテゴリ（`isDefault: true`）は削除不可 → 400 エラー
- 紐づくスポットが存在する場合 → 400 エラー（先にスポットのカテゴリ変更が必要）

**レスポンス: 200 OK**

```json
{
  "data": {
    "id": "uuid",
    "message": "Category deleted successfully"
  }
}
```

## 認証

### リクエストヘッダー

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 認証エラー

JWT が無効・期限切れ・未送信の場合:

```json
// 401 Unauthorized
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "認証が必要です"
  }
}
```

## エラーハンドリング

### エラーレスポンス形式

全エンドポイントで統一:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "人間が読めるエラーメッセージ",
    "details": {}
  }
}
```

### HTTPステータスコード

| コード | 用途 |
|--------|------|
| 200 | 成功（取得・更新・削除） |
| 201 | 成功（新規作成） |
| 400 | バリデーションエラー / リクエスト不正 |
| 401 | 認証エラー |
| 404 | リソースが見つからない |
| 500 | サーバー内部エラー |

### エラーコード一覧

| コード | 説明 |
|--------|------|
| `UNAUTHORIZED` | 認証が必要 / トークン無効 |
| `VALIDATION_ERROR` | バリデーションエラー |
| `NOT_FOUND` | リソースが見つからない |
| `DUPLICATE_CATEGORY` | カテゴリ名が重複 |
| `DEFAULT_CATEGORY_DELETE` | デフォルトカテゴリの削除は不可 |
| `CATEGORY_IN_USE` | スポットが紐づいているカテゴリの削除は不可 |
| `INTERNAL_ERROR` | サーバー内部エラー |

### バリデーションエラーの例

```json
// 400 Bad Request
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容に誤りがあります",
    "details": {
      "name": "スポット名は1〜100文字で入力してください",
      "visitedAt": "未来の日付は指定できません"
    }
  }
}
```
