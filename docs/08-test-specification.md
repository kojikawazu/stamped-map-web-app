# Test Specification (テスト仕様書)

## 目次

- [テスト戦略](#テスト戦略)
  - [テストピラミッド](#テストピラミッド)
  - [テスト方針](#テスト方針)
- [テストツール](#テストツール)
- [テストケース](#テストケース)
  - [Server API: Spots](#server-api-spots)
    - [GET /api/spots（一覧取得）](#get-apispots一覧取得)
    - [GET /api/spots/markers（マーカー用データ取得）](#get-apispotsmarkersマーカー用データ取得)
    - [POST /api/spots（登録）](#post-apispots登録)
    - [GET /api/spots/:id（詳細取得）](#get-apispotsid詳細取得)
    - [PUT /api/spots/:id（更新）](#put-apispotsid更新)
    - [DELETE /api/spots/:id（削除）](#delete-apispotsid削除)
  - [Server API: Categories](#server-api-categories)
    - [GET /api/categories（一覧取得）](#get-apicategories一覧取得)
    - [POST /api/categories（追加）](#post-apicategories追加)
    - [PUT /api/categories/:id（更新）](#put-apicategoriesid更新)
    - [DELETE /api/categories/:id（削除）](#delete-apicategoriesid削除)
  - [バリデーション（Zodスキーマ）](#バリデーションzodスキーマ)
- [カバレッジ目標](#カバレッジ目標)
- [テスト環境](#テスト環境)
  - [認証のテスト方針](#認証のテスト方針)
  - [テスト構成・実行環境](#テスト構成実行環境)
  - [テスト用DB](#テスト用db)
  - [CI/CD](#cicd)

## テスト戦略

### テストピラミッド

```
         ┌─────┐
         │ E2E │        少数（重要フローのみ）
        ┌┴─────┴┐
        │結合テスト│      Server API + Prisma
       ┌┴───────┴┐
       │ 単体テスト │    ユーティリティ、バリデーション
      └───────────┘
```

個人アプリのため、テストは**実用的な範囲**に絞る。全カバレッジを目指さず、壊れると困る部分を重点的にテストする。

### テスト方針

| レイヤー | テスト対象 | 優先度 |
|----------|-----------|--------|
| Server API | CRUD操作の正常系・異常系 | 高 |
| バリデーション | Zodスキーマのバリデーションロジック | 高 |
| ユーティリティ | 日付処理等の純粋関数 | 中 |
| composables | API クライアント・状態管理ロジック | 中 |
| E2E | 主要ユーザーフロー（auth / smoke / spots） | 実装済み |

## テストツール

| ツール | 用途 |
|--------|------|
| Vitest | ユニットテスト・結合テスト（prisma モック） |
| Testcontainers（`@testcontainers/postgresql` + PostGIS） | 統合テスト（IT）で実 DB を起動（`pnpm test:it`） |
| @vitest/coverage-v8 | カバレッジ計測（`pnpm test:coverage`） |
| @vue/test-utils + @nuxt/test-utils | composables・Nuxt 環境テスト |
| Playwright | E2Eテスト（実装済み） |

> **テストレイヤー**: ユニット（`pnpm test`、prisma モック・高速）/ **統合(IT)**（`pnpm test:it`、実 PostGIS を Testcontainers で起動し実 Prisma を検証。Supabase 認証のみモック）/ E2E（`pnpm test:e2e`）。IT は `front/__tests__/it/**/*.it.test.ts`、実行に Docker が必要。

> テストケースは **正常系（`N-`）/ 準正常系（`S-`）/ 異常系（`A-`）** で分類する。書き込み系エンドポイントは認可の異常系（オーナー限定=403）と DB 例外伝播を必須とする。分類規約の詳細は [`.claude/rules/testing.md`](../.claude/rules/testing.md)。

## テストケース

### Server API: Spots

#### GET /api/spots（一覧取得）

| # | テストケース | 期待結果 |
|---|------------|----------|
| 1 | 認証なしでリクエスト | 401 Unauthorized |
| 2 | スポットが0件 | 200, 空配列, pagination.total=0 |
| 3 | スポットが複数件 | 200, ページネーション付きで返却 |
| 4 | `sort=visited_at&order=desc` | 訪問日の降順で返却 |
| 5 | `sort=created_at&order=asc` | 登録日の昇順で返却 |
| 6 | `category=uuid1,uuid2` | 指定カテゴリのスポットのみ返却 |
| 7 | `q=東京` | 名前に「東京」を含むスポットのみ返却 |
| 8 | `page=2&limit=10` | 11〜20件目を返却、pagination情報が正しい |
| 9 | 存在しないカテゴリIDで絞り込み | 200, 空配列 |

#### GET /api/spots/markers（マーカー用データ取得）

| # | テストケース | 期待結果 |
|---|------------|----------|
| 1 | 認証なしでリクエスト | 401 Unauthorized |
| 2 | 全件取得 | 200, 全スポットの軽量データ |
| 3 | レスポンスに id, name, latitude, longitude, categoryId, categoryColor のみ含む | 余分なフィールドがない |
| 4 | `category=uuid` | 指定カテゴリのマーカーのみ |
| 5 | `q=東京` | 検索結果のマーカーのみ |

#### POST /api/spots（登録）

| # | テストケース | 期待結果 |
|---|------------|----------|
| 1 | 正常な入力で登録 | 201, 登録されたスポットを返却 |
| 2 | name が空 | 400, VALIDATION_ERROR |
| 3 | name が101文字以上 | 400, VALIDATION_ERROR |
| 4 | categoryId が無効なUUID | 400, VALIDATION_ERROR |
| 5 | categoryId が存在しないカテゴリ | 400, VALIDATION_ERROR |
| 6 | longitude が範囲外（181） | 400, VALIDATION_ERROR |
| 7 | latitude が範囲外（91） | 400, VALIDATION_ERROR |
| 8 | visitedAt が未来日 | 400, VALIDATION_ERROR |
| 9 | memo が1001文字以上 | 400, VALIDATION_ERROR |
| 10 | 認証なしでリクエスト | 401 Unauthorized |

#### GET /api/spots/:id（詳細取得）

| # | テストケース | 期待結果 |
|---|------------|----------|
| 1 | 存在するIDで取得 | 200, スポット詳細を返却 |
| 2 | 存在しないIDで取得 | 404, NOT_FOUND |
| 3 | 不正なID形式 | 400, VALIDATION_ERROR |

#### PUT /api/spots/:id（更新）

| # | テストケース | 期待結果 |
|---|------------|----------|
| 1 | 正常な入力で更新 | 200, 更新されたスポットを返却 |
| 2 | 存在しないIDで更新 | 404, NOT_FOUND |
| 3 | バリデーションエラー（POST と同じルール） | 400, VALIDATION_ERROR |

#### DELETE /api/spots/:id（削除）

| # | テストケース | 期待結果 |
|---|------------|----------|
| 1 | 存在するIDで削除 | 200, 削除成功メッセージ |
| 2 | 存在しないIDで削除 | 404, NOT_FOUND |

### Server API: Categories

#### GET /api/categories（一覧取得）

| # | テストケース | 期待結果 |
|---|------------|----------|
| 1 | 認証なしでリクエスト | 401 Unauthorized |
| 2 | デフォルトカテゴリ5件が取得できる | 200, 5件返却 |
| 3 | カスタムカテゴリ追加後に全件取得 | 200, 6件以上返却 |
| 4 | spotCount が正しく計算される | 各カテゴリの紐づきスポット数が正確 |

#### POST /api/categories（追加）

| # | テストケース | 期待結果 |
|---|------------|----------|
| 1 | 正常な入力で追加 | 201, 追加されたカテゴリを返却 |
| 2 | name が空 | 400, VALIDATION_ERROR |
| 3 | name が51文字以上 | 400, VALIDATION_ERROR |
| 4 | name が既存カテゴリと重複 | 400, DUPLICATE_CATEGORY |
| 5 | color が無効な形式 | 400, VALIDATION_ERROR |

#### PUT /api/categories/:id（更新）

| # | テストケース | 期待結果 |
|---|------------|----------|
| 1 | 正常な入力で更新 | 200, 更新されたカテゴリを返却 |
| 2 | 存在しないIDで更新 | 404, NOT_FOUND |
| 3 | name を既存名と重複する値に変更 | 400, DUPLICATE_CATEGORY |
| 4 | デフォルトカテゴリの名前・色を変更 | 200（更新可能） |

#### DELETE /api/categories/:id（削除）

| # | テストケース | 期待結果 |
|---|------------|----------|
| 1 | カスタムカテゴリ（スポットなし）を削除 | 200 |
| 2 | デフォルトカテゴリを削除 | 400, DEFAULT_CATEGORY_DELETE |
| 3 | スポットが紐づくカテゴリを削除 | 400, CATEGORY_IN_USE |

### バリデーション（Zodスキーマ）

| # | テストケース | 期待結果 |
|---|------------|----------|
| 1 | 全フィールドが正常 | パース成功 |
| 2 | 必須フィールドが欠落 | パースエラー、該当フィールドのエラーメッセージ |
| 3 | 文字数上限超過 | パースエラー |
| 4 | 座標が範囲外 | パースエラー |
| 5 | 日付が不正な形式 | パースエラー |
| 6 | HEXカラーコードが不正（#GGGGGGなど） | パースエラー |

## カバレッジ目標

| 対象 | 目標 | 備考 |
|------|------|------|
| Server API | 80%+ | 正常系・主要異常系をカバー |
| バリデーション | 90%+ | 全ルールをテスト |
| ユーティリティ | 80%+ | 純粋関数は高カバレッジ |
| composables | - | 主要ロジックを優先的にカバー |

**全体閾値（CI で強制）**: ロジック層（`server/**` / `composables/**` / `lib/**` / `middleware/**`）で Statements / Branches ともに **80% 以上**。`vitest.config.ts` の `coverage.thresholds` に設定しており、下回ると `pnpm test:coverage` が失敗する。CI はこのコマンドを実行するため、閾値割れはマージ前に検出される。

> 上表は対象ごとの**目標**（努力目標）、閾値は**全体の下限**（機械的な強制）という役割分担。

## テスト環境

### 認証のテスト方針

- **`verifyAuth()` / `verifyOwner()` をモックして Server API ロジックのみテストする**
- これらは `server/utils/auth.ts` で定義され、Nuxt の auto-import により各ハンドラーへグローバル注入される。テストでは `vi.stubGlobal` でスタブする
- 認証失敗は `createError`（H3）で送出するため、専用の `AuthError` クラスは存在しない
- テスト用 Supabase ユーザーの作成・管理は行わない
- 認証フロー自体（Supabase Auth SDK）は外部サービスの責務として信頼する

```typescript
// テスト例（auto-import 前提のため stubGlobal を使用）
vi.stubGlobal(
  "verifyAuth",
  vi.fn().mockResolvedValue({ id: "test-user-id", email: "test@example.com" })
);
```

### テスト構成・実行環境

| 種別 | ツール | 対象ディレクトリ | 備考 |
|------|--------|-----------------|------|
| ユニット/結合 | Vitest | `front/__tests__/**` | `tests/e2e/**` / `**/*.it.test.ts` は exclude（`vitest.config.ts`） |
| 統合（IT） | Vitest + Testcontainers | `front/__tests__/it/**` | `*.it.test.ts`。専用の `vitest.config.it.ts` で実行 |
| E2E | Playwright | `front/tests/e2e/**` | `testDir: ./tests/e2e`、Base URL `http://localhost:3000`（`playwright.config.ts`） |

**配置方針**: テストはソースの隣に置かず（コロケーションしない）、上記ディレクトリに**集約**する。ソースのディレクトリ構造をミラーして配置すること（例: `composables/useSpots.ts` → `__tests__/composables/useSpots.test.ts`）。詳細と理由は `.claude/rules/testing.md`「テストファイルの配置」を参照。

### テスト用DB

- ローカル PostgreSQL + PostGIS、または Supabase テスト用プロジェクト
- テスト実行前にマイグレーション + シードデータ投入（デフォルトカテゴリのみ）
- テスト後にデータクリーンアップ

### CI/CD

GitHub Actions（`.github/workflows/ci.yml`）で `front/**` 変更時に自動実行する。いずれかのゲート失敗で PR をブロックする。

**test ジョブ**（品質ゲート）:

1. `nuxt prepare`（型定義・ESLint flat config を生成）
2. `pnpm type-check`（`nuxt typecheck` = vue-tsc、`tsc --noEmit` 相当）
3. `pnpm lint`（ESLint。JSDoc/TSDoc ルールを含む）
4. `pnpm format:check`（Prettier 整形チェック）
5. `pnpm test`（Vitest ユニット・結合、prisma モック）

**it ジョブ**（統合テスト）: `prisma generate` → `pnpm test:it`。Testcontainers が PostGIS コンテナを起動し実 Prisma を検証する（ubuntu-latest の Docker を利用、services 定義不要）。

**e2e ジョブ**（実 DB シナリオ）: `services: postgis` を起動 → `pnpm build` → `prisma db push` + `pnpm db:seed` → 本番サーバーを `E2E_AUTH_BYPASS=1` で起動 → `pnpm test:e2e`（Playwright）。API はモックせず実データを検証する。失敗時は `playwright-report` を artifact 保存。
