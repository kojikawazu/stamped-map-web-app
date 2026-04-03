# テスト設計書 — Stamped Map Web App

## 対象

- **プロジェクト**: Stamped Map Web App
- **スタック**: Nuxt.js 3 + TypeScript（フロントエンド一体型）
- **テストツール**:
  - ユニット/結合テスト: Vitest + `@nuxt/test-utils`
  - E2E: Playwright
  - CI: GitHub Actions

---

## テスト構成の全体像

```
テストピラミッド

         ┌──────────────┐
         │  E2E テスト   │  Playwright（主要ユーザーフロー）
        ┌┴──────────────┴┐
        │  結合テスト      │  Vitest（Server Routes + Prismaモック）
       ┌┴────────────────┴┐
       │  ユニットテスト    │  Vitest（Composables・バリデーション）
      └──────────────────┘
```

### ファイル配置

```
front/
├── __tests__/
│   ├── server/utils/
│   │   └── api-helpers.test.ts       # 既存（10テスト）
│   ├── server/api/
│   │   ├── spots.test.ts             # 新規：Server Routes 結合テスト
│   │   └── categories.test.ts        # 新規：Server Routes 結合テスト
│   ├── composables/
│   │   ├── useSpotFilter.test.ts     # 新規：フィルター状態ロジック
│   │   └── useApiClient.test.ts      # 新規：401リトライロジック
│   └── lib/validations/
│       ├── spot.test.ts              # 既存（14テスト）
│       └── category.test.ts          # 既存（5テスト）
└── tests/
    └── e2e/
        ├── helpers.ts                # 新規：共通ヘルパー・モックデータ
        ├── smoke.spec.ts             # 新規：スモークテスト
        ├── auth.spec.ts              # 新規：認証フロー
        └── spots.spec.ts             # 新規：スポット一覧・地図マーカー
```

---

## 1. ユニットテスト

### 1-1. `useSpotFilter`（composables/useSpotFilter.ts）

**対象ファイル**: `front/composables/useSpotFilter.ts`
**テストファイル**: `front/__tests__/composables/useSpotFilter.test.ts`
**モック対象**: なし（純粋な状態管理ロジック）

#### 正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| N-1 | 初期状態が正しい | — | `searchQuery=""`, `selectedCategories=[]`, `sortField="visited_at"`, `sortOrder="desc"`, `page=1` | High |
| N-2 | `setSearch` で検索クエリが更新される | `setSearch("東京")` | `searchQuery="東京"`, `page=1` にリセット | High |
| N-3 | `toggleCategory` でカテゴリが追加される | `toggleCategory("cat-1")` | `selectedCategories=["cat-1"]`, `page=1` にリセット | High |
| N-4 | `toggleCategory` で同じIDを再度押すと除外される | `toggleCategory("cat-1")` × 2回 | `selectedCategories=[]` | High |
| N-5 | `setSort` でソート条件が変わる | `setSort("created_at", "asc")` | `sortField="created_at"`, `sortOrder="asc"`, `page=1` にリセット | High |
| N-6 | `setPage` でページが変わる | `setPage(3)` | `page=3` | High |
| N-7 | `resetFilters` で全状態が初期値に戻る | 各種設定後に `resetFilters()` | 全フィールドが初期値 | High |
| N-8 | `spotsQuery` にフィルター条件が正しく反映される | `setSearch("東京")`, `toggleCategory("cat-1")` | `spotsQuery.q="東京"`, `spotsQuery.category="cat-1"` | High |
| N-9 | `markersQuery` はページネーション情報を含まない | 各種フィルター設定後 | `page`, `limit`, `sort`, `order` が含まれない | High |
| N-10 | 複数カテゴリ選択時はカンマ区切りになる | `toggleCategory("cat-1")`, `toggleCategory("cat-2")` | `markersQuery.category="cat-1,cat-2"` | Medium |

#### 準正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| S-1 | フィルター変更時に `page` が 1 にリセットされる | `page=3` 後に `setSearch("東京")` | `page=1` | High |
| S-2 | `searchQuery` が空のとき `spotsQuery` に `q` が含まれない | `setSearch("")` | `spotsQuery` に `q` キーなし | Medium |
| S-3 | `selectedCategories` が空のとき `spotsQuery` に `category` が含まれない | `resetFilters()` | `spotsQuery` に `category` キーなし | Medium |

---

### 1-2. `useApiClient`（composables/useApiClient.ts）

**対象ファイル**: `front/composables/useApiClient.ts`
**テストファイル**: `front/__tests__/composables/useApiClient.test.ts`
**モック対象**: `useSupabaseClient`（外部I/O）、`$fetch`（外部I/O）

#### 正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| N-1 | 正常なリクエストで Bearer トークンが付与される | `apiFetch("/api/spots")` | `Authorization: Bearer <token>` ヘッダー付きで呼ばれる | High |
| N-2 | レスポンスデータが返る | 正常なAPIレスポンス | 型安全なレスポンスが返る | High |

#### 準正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| S-1 | 401 エラー時にトークンをリフレッシュして1回リトライする | 初回 401 → リフレッシュ成功 → 2回目 200 | 1回のリトライ後に正常レスポンス | High |
| S-2 | リフレッシュ失敗時に `/login` にリダイレクトする | 401 → リフレッシュ失敗 | `navigateTo("/login")` が呼ばれる | High |
| S-3 | 401 以外のエラーはリトライせず例外をスローする | 500 エラー | 例外がそのままスローされる | Medium |

---

## 2. 結合テスト（Server Routes）

### 共通前提

- `verifyAuth` をモック（`vi.mock`）して認証をスキップ
- Prisma クライアントをモックして実DBに依存しない
- 認証エラーテスト（401）は `verifyAuth` が例外をスローするようモック

**モック方針**:
- モック許可: `verifyAuth`（外部I/O）、`prisma`（外部I/O）
- モック禁止: バリデーションロジック、レスポンス整形関数

---

### 2-1. `GET /api/spots`

**テストファイル**: `front/__tests__/server/api/spots.test.ts`

#### 正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| N-1 | スポット一覧が取得できる | クエリなし | 200, `data[]`, `pagination` | High |
| N-2 | ページネーションが機能する | `page=2&limit=10` | 200, `pagination.page=2` | High |
| N-3 | カテゴリフィルターが機能する | `category=uuid` | 200, 指定カテゴリのみ | High |
| N-4 | 名前検索が機能する | `q=東京` | 200, 名前に「東京」を含むもののみ | High |
| N-5 | ソートが機能する | `sort=visited_at&order=asc` | 200, 訪問日昇順 | Medium |

#### 準正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| S-1 | 認証なしのリクエスト | `Authorization` ヘッダーなし | 401, `UNAUTHORIZED` | High |
| S-2 | スポットが0件のとき | DBが空 | 200, `data=[]`, `pagination.total=0` | High |

---

### 2-2. `GET /api/spots/markers`

**テストファイル**: `front/__tests__/server/api/spots.test.ts`（上記と同ファイル）

#### 正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| N-1 | 全マーカーデータが取得できる | クエリなし | 200, `id/name/latitude/longitude/categoryId/categoryColor` のみ | High |
| N-2 | カテゴリフィルターが機能する | `category=uuid` | 200, 指定カテゴリのみ | High |
| N-3 | 余分なフィールドが含まれない | — | `memo`, `visitedAt` 等が含まれない | Medium |

#### 準正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| S-1 | 認証なしのリクエスト | `Authorization` ヘッダーなし | 401, `UNAUTHORIZED` | High |

---

### 2-3. `POST /api/spots`

#### 正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| N-1 | 正常なデータで登録できる | 全フィールド有効 | 201, 登録されたスポット | High |

#### 準正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| S-1 | 認証なしのリクエスト | `Authorization` ヘッダーなし | 401 | High |
| S-2 | `name` が空 | `name=""` | 400, `VALIDATION_ERROR` | High |
| S-3 | `name` が101文字以上 | `name="a".repeat(101)` | 400, `VALIDATION_ERROR` | High |
| S-4 | `latitude` が範囲外 | `latitude=91` | 400, `VALIDATION_ERROR` | High |
| S-5 | `longitude` が範囲外 | `longitude=181` | 400, `VALIDATION_ERROR` | High |
| S-6 | `visitedAt` が未来日 | 明日の日付 | 400, `VALIDATION_ERROR` | High |
| S-7 | 存在しない `categoryId` | 存在しないUUID | 400, `VALIDATION_ERROR` | High |

---

### 2-4. `GET /api/spots/:id`

#### 正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| N-1 | 存在するIDで取得できる | 有効なUUID | 200, スポット詳細 | High |

#### 準正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| S-1 | 存在しないID | 存在しないUUID | 404, `NOT_FOUND` | High |
| S-2 | 不正なID形式 | `"not-a-uuid"` | 400, `VALIDATION_ERROR` | Medium |

---

### 2-5. `PUT /api/spots/:id` / `DELETE /api/spots/:id`

#### 正常系・準正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| N-1 | 正常な入力で更新できる | 有効なUUID + 有効なボディ | 200, 更新されたスポット | High |
| S-1 | 存在しないIDで更新 | 存在しないUUID | 404, `NOT_FOUND` | High |
| N-2 | 存在するIDで削除できる | 有効なUUID | 200, 削除成功メッセージ | High |
| S-2 | 存在しないIDで削除 | 存在しないUUID | 404, `NOT_FOUND` | High |

---

### 2-6. Categories API

**テストファイル**: `front/__tests__/server/api/categories.test.ts`

| # | テストケース | メソッド | 期待結果 | 優先度 |
|---|---|---|---|---|
| N-1 | カテゴリ一覧が取得できる | GET | 200, `data[]` with `spotCount` | High |
| N-2 | カテゴリを追加できる | POST | 201, 追加されたカテゴリ | High |
| S-1 | 重複カテゴリ名 | POST | 400, `DUPLICATE_CATEGORY` | High |
| S-2 | カテゴリを更新できる | PUT | 200, 更新されたカテゴリ | High |
| S-3 | デフォルトカテゴリの削除 | DELETE | 400, `DEFAULT_CATEGORY_DELETE` | High |
| S-4 | スポットが紐づくカテゴリの削除 | DELETE | 400, `CATEGORY_IN_USE` | High |
| N-3 | カスタムカテゴリ（スポットなし）の削除 | DELETE | 200 | High |

---

## 3. E2Eテスト（Playwright）

### 共通設定

- **baseURL**: `http://localhost:3000`（`pnpm dev`）
- **認証**: Supabase の localStorage キーにダミーセッションを inject
- **API**: `page.route()` でインターセプト＆モック（実DBに依存しない）
- **ブラウザ**: Chromium のみ（MVP）
- **CI**: リトライ1回、失敗時スクリーンショット・動画を保存

### helpers.ts の提供内容

```typescript
// テスト用ダミーデータ
export const baseSpots: MockSpot[]
export const baseCategories: MockCategory[]

// API モック
export async function mockSpotsApi(page, spots)
export async function mockMarkersApi(page, spots)
export async function mockCategoriesApi(page, categories)

// 認証
export async function injectSupabaseSession(page)  // localStorage にダミーセッション注入
export async function clearSupabaseSession(page)
```

---

### 3-1. スモークテスト（smoke.spec.ts）

| # | テストケース | 期待結果 | 優先度 |
|---|---|---|---|
| N-1 | `/login` ページが表示される | ログインフォームが表示 | High |
| N-2 | 認証済みで `/` にアクセスすると地図画面が表示される | 左パネル + 地図エリアが表示 | High |
| N-3 | 未認証で `/` にアクセスすると `/login` にリダイレクトされる | URL が `/login` になる | High |
| N-4 | コンソールエラーが出ていない | `console.error` が呼ばれない | High |

---

### 3-2. 認証フロー（auth.spec.ts）

#### 正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| N-1 | 正しいメール・パスワードでログインできる | 有効な認証情報 | `/` にリダイレクト、地図画面表示 | High |
| N-2 | ログアウトするとログイン画面に戻る | ヘッダーのログアウトボタン | `/login` にリダイレクト | High |

#### 準正常系

| # | テストケース | 入力 | 期待結果 | 優先度 |
|---|---|---|---|---|
| S-1 | 誤ったパスワードでログイン失敗 | 無効なパスワード | エラーメッセージ表示、ページ遷移なし | High |
| S-2 | 未認証で `/` にアクセス | セッションなし | `/login` にリダイレクト | High |

---

### 3-3. スポット一覧・フィルター（spots.spec.ts）

#### 正常系

| # | テストケース | 操作 | 期待結果 | 優先度 |
|---|---|---|---|---|
| N-1 | スポット一覧が表示される | 認証済みで `/` 表示 | 左パネルにスポットリストが表示 | High |
| N-2 | スポット名で検索できる | 検索ボックスに「東京」入力 | 「東京」を含むスポットのみ表示 | High |
| N-3 | カテゴリフィルターで絞り込める | カテゴリバッジをクリック | 選択カテゴリのスポットのみ表示 | High |
| N-4 | ソートを変更できる | ソートセレクトを変更 | 表示順が変わる | Medium |
| N-5 | ページネーションが機能する | 「次へ」ボタンをクリック | 次ページのスポットが表示 | Medium |
| N-6 | 検索クリアボタンで全件に戻る | 検索後にクリアボタン | 全スポット表示 | Medium |

#### 準正常系

| # | テストケース | 操作 | 期待結果 | 優先度 |
|---|---|---|---|---|
| S-1 | 検索結果が0件のとき空状態メッセージが表示される | 存在しない名前で検索 | 「スポットが見つかりませんでした」表示 | High |
| S-2 | フィルター変更時にページが1にリセットされる | 2ページ目でカテゴリフィルター変更 | ページが1に戻る | Medium |

---

### 3-4. 地図マーカー（spots.spec.ts に含める）

#### 正常系

| # | テストケース | 操作 | 期待結果 | 優先度 |
|---|---|---|---|---|
| N-1 | 地図エリアが表示される | 認証済みで `/` 表示 | MapLibreの地図が描画される | High |
| N-2 | マーカークリックでポップアップが表示される | マーカーをクリック | スポット名・カテゴリ名のポップアップ表示 | Medium |

---

## 4. GitHub Actions CI

### ワークフロー設計

**ファイル**: `.github/workflows/ci.yml`

```
トリガー:
  push: main, feature/**, fix/**, chore/**
  pull_request: 上記ブランチへのPR
  paths: front/**, .github/workflows/ci.yml のみ（docs変更では不実行）

ジョブ: lint-and-test
  1. Checkout
  2. pnpm セットアップ（バージョン固定）
  3. Node.js 20 セットアップ（pnpm キャッシュ）
  4. pnpm install --frozen-lockfile
  5. pnpm test（ユニット + 結合テスト）
  6. Playwright ブラウザインストール
  7. pnpm test:e2e（E2Eテスト）
```

**環境変数（CI時のダミー値）**:
- `NUXT_PUBLIC_SUPABASE_URL`: ダミーURL
- `NUXT_PUBLIC_SUPABASE_ANON_KEY`: ダミーキー
- `NUXT_PUBLIC_MAPTILER_KEY`: ダミーキー

> E2Eテストは `page.route()` でAPIをモックするため、実際の外部サービスへの接続は不要。

---

## 5. テスト追加に伴う package.json 変更

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.1"
  }
}
```

**vitest.config.ts の変更点**:
- `exclude` に `tests/e2e/**` を追加（E2Eテストをユニットテスト実行から除外）

---

## 実装順序

| 順序 | 種別 | ファイル | 理由 |
|------|------|---------|------|
| 1 | 設定 | `vitest.config.ts` 更新 | E2E除外設定が先に必要 |
| 2 | 設定 | `playwright.config.ts` 新規 | E2Eの基盤 |
| 3 | 設定 | `package.json` スクリプト追加 | CIで使うコマンド |
| 4 | ユニット | `useSpotFilter.test.ts` | 純粋ロジック・モック不要 |
| 5 | ユニット | `useApiClient.test.ts` | 401リトライのコアロジック |
| 6 | 結合 | `spots.test.ts` | API最重要エンドポイント |
| 7 | 結合 | `categories.test.ts` | API |
| 8 | E2E | `helpers.ts` | E2Eの共通基盤 |
| 9 | E2E | `smoke.spec.ts` | 最小限の死活確認 |
| 10 | E2E | `auth.spec.ts` | 認証フロー |
| 11 | E2E | `spots.spec.ts` | メイン機能フロー |
| 12 | CI | `.github/workflows/ci.yml` | 最後に全体を繋ぐ |
