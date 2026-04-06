# 設計書: CRUD操作のオーナー制限

> Issue: #33
> 対象ブランチ: `feature/restrict-crud-to-owner`

## 背景・目的

Google OAuth 導入により、Gmail アカウントを持つ任意のユーザーがログイン可能な状態になった。
閲覧（GET）は公開のままで問題ないが、スポット・カテゴリの登録・編集・削除（Write系操作）はアプリオーナーのみに制限する。

## 設計方針

- `verifyAuth()` は JWT 検証のみを担う（責務は変えない）
- 新たに `verifyOwner()` を追加し、Write系APIエンドポイントで使用する
- 許可ユーザーは環境変数 `ALLOWED_EMAILS` でカンマ区切りで管理する
- GET系エンドポイントは引き続き `verifyAuth()` のみ（変更なし）

## 実装設計

### 環境変数

| 変数名 | 説明 | 例 |
|--------|------|-----|
| `ALLOWED_EMAILS` | CRUD操作を許可するメールアドレス（カンマ区切り） | `owner@gmail.com` |

- ローカル: `front/.env.local` に追加
- 本番: Vercel 環境変数に追加

### `server/utils/auth.ts` への追加

```typescript
/**
 * CRUD操作（Write系）専用の認証・認可チェック。
 * verifyAuth() によるJWT検証に加え、ALLOWED_EMAILS に含まれるユーザーのみ通過させる。
 * 許可されていない場合は 403 を返す。
 */
export async function verifyOwner(event: H3Event) {
  const user = await verifyAuth(event);

  const allowedEmails = (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length === 0) {
    // ALLOWED_EMAILS 未設定はオーナー未定義とみなし 403
    throw createError({ statusCode: 403, message: "操作が許可されていません" });
  }

  if (!allowedEmails.includes((user.email ?? "").toLowerCase())) {
    throw createError({ statusCode: 403, message: "操作が許可されていません" });
  }

  return user;
}
```

### 各エンドポイントの変更

| エンドポイント | 変更前 | 変更後 |
|--------------|--------|--------|
| `GET /api/spots` | `verifyAuth` | `verifyAuth`（変更なし） |
| `GET /api/spots/markers` | `verifyAuth` | `verifyAuth`（変更なし） |
| `GET /api/spots/:id` | `verifyAuth` | `verifyAuth`（変更なし） |
| `POST /api/spots` | `verifyAuth` | `verifyOwner` |
| `PUT /api/spots/:id` | `verifyAuth` | `verifyOwner` |
| `DELETE /api/spots/:id` | `verifyAuth` | `verifyOwner` |
| `GET /api/categories` | `verifyAuth` | `verifyAuth`（変更なし） |
| `POST /api/categories` | `verifyAuth` | `verifyOwner` |
| `PUT /api/categories/:id` | `verifyAuth` | `verifyOwner` |
| `DELETE /api/categories/:id` | `verifyAuth` | `verifyOwner` |

### フロントエンド側の対応

#### ボタン表示制御

`GET /api/me/is-owner` でサーバー側の `ALLOWED_EMAILS` を使って判定し、クライアントには `true`/`false` だけ返す。メールアドレスをクライアントに渡さない設計。

- `server/api/me/is-owner.get.ts` — `verifyAuth` + `ALLOWED_EMAILS` 照合 → `{ data: { isOwner } }` を返す
- `composables/useIsOwner.ts` — `useState("isOwner")` でグローバル状態管理、`fetchIsOwner()` でAPI呼び出し
- `SpotPanel.vue` — `onMounted` で `fetchIsOwner()` を呼び、「登録」「カテゴリ管理」ボタンを `v-if="isOwner"` で制御
- `SpotDetailDrawer.vue` — 共有状態 `isOwner` を参照し、「編集」「削除」ボタンを `v-if="isOwner"` で制御

APIが 403 を返した場合は、既存の `useApiClient.ts` のエラーハンドリングで素通りする（表示上は操作できないため実用上問題なし）。

## テスト設計

### ユニットテスト（`server/utils/auth.ts`）

| テストケース | 期待結果 |
|------------|---------|
| ALLOWED_EMAILS に含まれるメールでアクセス | 200（通過） |
| ALLOWED_EMAILS に含まれないメールでアクセス | 403 |
| ALLOWED_EMAILS が未設定の場合 | 403 |
| 複数メール設定時、該当するメールでアクセス | 200（通過） |

### APIエンドポイントテスト

- Write系エンドポイントに非オーナーの JWT でリクエスト → 403 を返すことを確認
- Write系エンドポイントにオーナーの JWT でリクエスト → 正常動作を確認

## `.env.example` への追記

```
# オーナー制限（CRUD操作を許可するメールアドレス、カンマ区切り）
ALLOWED_EMAILS=owner@example.com
```
