---
description: テスト方針（ユニット・E2E・カバレッジ基準）
globs: "front/__tests__/**,front/tests/**"
---

# テスト方針

- **テスト必須**: 実装時はテストコードも必ず書く。
- **テストファースト推奨**: 実装前にテストケースを考慮する。
- **モック最小化**: 必要最小限のモックに留め、実際の動作に近いテストを書く（外部境界＝DB / Supabase / `$fetch` のみモックし、ハンドラの実ロジックは本物を通す）。

## テストケースの分類（正常系 / 準正常系 / 異常系）

各テストは 3 分類を意識し、テスト名に接頭辞を付ける（`describe` 単位で該当分類を網羅する）。

| 接頭辞 | 分類 | 対象 |
|---|---|---|
| `N-` | 正常系 | 期待どおりの入力での成功パス |
| `S-` | 準正常系 | バリデーション 400 / 404 / 業務ガード（重複・使用中等）/ 境界値・フォールバック |
| `A-` | 異常系 | 認可失敗（401/403）・想定外例外（DB エラー等の伝播） |

- **書き込み系（POST/PUT/DELETE）は認可の異常系（オーナー限定 = 403）を必須**とする（`verifyOwner` 失敗時に DB 書き込みへ到達しないことも検証する）。
- 外部依存（DB 等）の**例外伝播（異常系）**も代表ケースで検証する。

## テストレイヤー（ユニット / 統合(IT) / E2E）

| レイヤー | 実行 | DB | モック範囲 | 目的 |
|---|---|---|---|---|
| ユニット/結合 | `pnpm test` | prisma を**モック** | DB / Supabase / `$fetch` | ハンドラ・composable のロジック（高速） |
| 統合（IT） | `pnpm test:it` | **実 PostGIS**（Testcontainers） | Supabase 認証のみ | 実 Prisma クエリ・DB 制約・集計/ソート/検索の検証 |
| E2E | `pnpm test:e2e` | **実 PostGIS**（compose / CI service） | Supabase 認証のみ（`E2E_AUTH_BYPASS`） | 実データのシナリオ（Playwright） |

- **IT の境界**: 「Server ハンドラ + 実 Prisma + 実 Postgres」。外部の Supabase 認証（`verifyAuth` / `verifyOwner`）のみモック維持する。
- IT ファイルは `front/__tests__/it/**/*.it.test.ts`。ユニット実行（`pnpm test`）からは除外し、専用 `vitest.config.it.ts` で走らせる。
- IT は単一 DB コンテナを共有するため、各テスト前に全テーブルを `TRUNCATE` する（`fileParallelism: false`）。
- IT の実行には Docker が必要（ローカル・CI とも Testcontainers が自動でコンテナを起動/破棄）。

### E2E（実 DB シナリオ）

- **境界**: ブラウザ → Nuxt server → 実 Prisma → 実 Postgres。API はモックしない。認証は `E2E_AUTH_BYPASS`（後述）でサーバー側の Supabase 検証をスキップし、クライアントは `injectSupabaseSession` でログイン状態を注入する。
- **flaky 対策**: web-first assertion（自動待機）を使い `waitForTimeout` を避ける。CI では `retries: 2` / `workers: 1` / `trace: on-first-retry`。決定的なシード（`prisma/seed.ts`）に対してアサートする。
- **ローカル実行**:
  1. `docker compose up -d`（リポジトリ直下、PostGIS を 5433 で起動）
  2. `cd front && DATABASE_URL=postgresql://stamped:stamped@localhost:5433/stamped pnpm exec prisma db push && DATABASE_URL=... pnpm db:seed`
  3. `E2E_AUTH_BYPASS=1 ALLOWED_EMAILS=e2e@example.com DATABASE_URL=... pnpm dev`（別ターミナル）
  4. `CI=true PLAYWRIGHT_BASE_URL=http://localhost:3000 pnpm test:e2e`

## カバレッジ

- 計測: `pnpm test:coverage`（Vitest + `@vitest/coverage-v8`）。対象はロジック層（`server/**` / `composables/**` / `lib/**` / `middleware/**`）。`.vue` の描画は E2E で担保するため計測対象外。
- 目安: ロジック層で Statements / Branches ともに 80% 以上を維持する。

## テストツール

| テスト種別 | ツール |
|-----------|--------|
| ユニットテスト | Vitest + @vue/test-utils / @nuxt/test-utils |
| 統合テスト（IT） | Vitest + Testcontainers（`@testcontainers/postgresql` + PostGIS） |
| カバレッジ | `@vitest/coverage-v8`（`pnpm test:coverage`） |
| E2E テスト | Playwright |
| スモークテスト | Playwright（起動確認・主要ページ表示） |
