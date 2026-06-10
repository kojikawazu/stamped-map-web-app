# API Specification (API仕様書)

## 目次

- [概要](#概要)
- [エンドポイント一覧](#エンドポイント一覧)
- [Spots API](#spots-api)
  - [GET /api/spots — スポット一覧取得](#get-apispots--スポット一覧取得)
  - [GET /api/spots/markers — 地図マーカー用データ取得](#get-apispotsmarkers--地図マーカー用データ取得)
  - [GET /api/spots/:id — スポット詳細取得](#get-apispotsid--スポット詳細取得)
  - [POST /api/spots — スポット登録](#post-apispots--スポット登録)
  - [PUT /api/spots/:id — スポット更新](#put-apispotsid--スポット更新)
  - [DELETE /api/spots/:id — スポット削除](#delete-apispotsid--スポット削除)
- [Categories API](#categories-api)
  - [GET /api/categories — カテゴリ一覧取得](#get-apicategories--カテゴリ一覧取得)
  - [POST /api/categories — カテゴリ追加](#post-apicategories--カテゴリ追加)
  - [PUT /api/categories/:id — カテゴリ更新](#put-apicategoriesid--カテゴリ更新)
  - [DELETE /api/categories/:id — カテゴリ削除](#delete-apicategoriesid--カテゴリ削除)
- [Me API](#me-api)
  - [GET /api/me/is-owner — オーナー判定](#get-apimeis-owner--オーナー判定)
- [認証](#認証)
  - [リクエストヘッダー](#リクエストヘッダー)
  - [認証エラー](#認証エラー)
- [エラーハンドリング](#エラーハンドリング)
  - [エラーレスポンス形式](#エラーレスポンス形式)
  - [HTTPステータスコード](#httpステータスコード)
  - [エラーコード一覧](#エラーコード一覧)
  - [バリデーションエラーの例](#バリデーションエラーの例)

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
| POST | `/api/spots` | スポット登録 | 必須（オーナーのみ） |
| PUT | `/api/spots/:id` | スポット更新 | 必須（オーナーのみ） |
| DELETE | `/api/spots/:id` | スポット削除 | 必須（オーナーのみ） |
| GET | `/api/categories` | カテゴリ一覧取得 | 必須 |
| POST | `/api/categories` | カテゴリ追加 | 必須（オーナーのみ） |
| PUT | `/api/categories/:id` | カテゴリ更新 | 必須（オーナーのみ） |
| DELETE | `/api/categories/:id` | カテゴリ削除 | 必須（オーナーのみ） |
| GET | `/api/me/is-owner` | ログインユーザーがオーナーか判定 | 必須 |

> **オーナーのみ**: 環境変数 `ALLOWED_EMAILS` に登録されたユーザーのみ許可。非オーナーは 403 を返す。

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

## Me API

### GET /api/me/is-owner — オーナー判定

ログイン中のユーザーが `ALLOWED_EMAILS` に含まれる（＝Write操作を許可されたオーナー）かどうかを返す。フロントが非オーナーに Write 操作ボタンを出さないために使用する。

**レスポンス: 200 OK**

```json
{
  "data": {
    "isOwner": true
  }
}
```

## 認証

### リクエストヘッダー

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### 認証エラー

JWT が無効・期限切れ・未送信の場合（`verifyAuth` / `verifyOwner` が送出）。認証・認可エラーは `createError` に `message` のみを渡すため、本体に `code` フィールドは含まれない:

```json
// 401 Unauthorized
{
  "statusCode": 401,
  "statusMessage": "...",
  "message": "認証が必要です"
}
```

```json
// 403 Forbidden（非オーナーの Write 操作）
{
  "statusCode": 403,
  "statusMessage": "...",
  "message": "操作が許可されていません"
}
```

## エラーハンドリング

### エラーレスポンス形式

本プロジェクトは Nuxt（Nitro）の `createError` を使用する。各ハンドラーは業務エラーを `createError({ statusCode, data: { code, message, details } })` で送出し、Nitro が以下の形でシリアライズする（トップレベルキーは `error` ではなく `data`）:

```json
{
  "statusCode": 400,
  "statusMessage": "...",
  "data": {
    "code": "ERROR_CODE",
    "message": "人間が読めるエラーメッセージ",
    "details": {}
  }
}
```

> フロントは `useApiClient` 経由で受け取ったエラーを `err.data.message` / `err.data.code` で参照する。
> 認証・認可エラー（401/403）のみ `data` を持たず、`message` だけを返す（上記「認証エラー」参照）。

### HTTPステータスコード

| コード | 用途 |
|--------|------|
| 200 | 成功（取得・更新・削除） |
| 201 | 成功（新規作成） |
| 400 | バリデーションエラー / リクエスト不正 |
| 401 | 認証エラー |
| 403 | 認可エラー（オーナー以外による Write操作） |
| 404 | リソースが見つからない |
| 500 | サーバー内部エラー |

### エラーコード一覧

| コード | 説明 |
|--------|------|
| `UNAUTHORIZED` | 認証が必要 / トークン無効 |
| `FORBIDDEN` | 操作が許可されていない（非オーナーによる Write操作） |
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
  "statusCode": 400,
  "statusMessage": "...",
  "data": {
    "code": "VALIDATION_ERROR",
    "message": "入力内容に誤りがあります",
    "details": {
      "name": "スポット名は1〜100文字で入力してください",
      "visitedAt": "未来の日付は指定できません"
    }
  }
}
```
