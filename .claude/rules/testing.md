---
description: テスト方針（ユニット・E2E・カバレッジ基準）
globs: "front/__tests__/**,front/tests/**"
---

# テスト方針

- **テスト必須**: 実装時はテストコードも必ず書く。
- **テストファースト推奨**: 実装前にテストケースを考慮する。
- **モック最小化**: 必要最小限のモックに留め、実際の動作に近いテストを書く（外部境界＝DB / Supabase / `$fetch` のみモックし、ハンドラの実ロジックは本物を通す）。

## テストファイルの配置（コロケーションではなく集約）

テストは**ソースの隣に置かず（コロケーションしない）、専用ディレクトリに集約する**。ソースのディレクトリ構造をミラーして配置し、対応関係を保つ。

```
front/
├── __tests__/              # ユニット/結合・IT を集約
│   ├── composables/        # composables/ をミラー
│   ├── repositories/       # repositories/ をミラー
│   ├── schemas/            # schemas/ をミラー
│   ├── lib/                # lib/ をミラー
│   ├── server/             # server/ をミラー（api/ / utils/）
│   └── it/                 # 統合テスト（実 DB）
│       └── harness.ts      # IT 用の共通足場
└── tests/e2e/              # E2E（Playwright）
```

| レイヤー | 置き場所 | ファイル名 |
|---|---|---|
| ユニット/結合 | `front/__tests__/<ソースと同じ相対パス>/` | `*.test.ts` |
| 統合（IT） | `front/__tests__/it/` | `*.it.test.ts` |
| E2E | `front/tests/e2e/` | `*.spec.ts` |

**集約を選ぶ理由**:

- 実行設定の `include` / `exclude` が単純になる。ユニット実行から IT を外す（`**/*.it.test.ts`）、E2E を外す（`tests/e2e/**`）といった除外が**パスと拡張子だけ**で書け、ソースツリーを走査せずに済む。
- カバレッジの計測対象（`server/**` / `composables/**` / `repositories/**` / `schemas/**` / `lib/**` / `middleware/**`）にテストが混入しない。コロケーションだと `exclude` の記述が増え、漏れるとカバレッジが実態より高く出る。
- 本番バンドルにテストが紛れ込む事故を、ディレクトリ単位で防げる。

**新規テストを追加するときは、対応するソースと同じ相対パスに置く**（例: `composables/useSpots.ts` → `__tests__/composables/useSpots.test.ts`）。ミラー構造が崩れると、テストの有無を目視で確認できなくなる。

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
- **ローカル実行**（`make e2e-full` で 1〜3 を一括実行できる）:
  1. `make db-up`（= `docker compose up -d --wait`。リポジトリ直下、PostGIS を 5433 で起動）
  2. `cd front && pnpm db:setup:test`（接続先ガードを通してスキーマ同期 + シード。接続先は `TEST_DATABASE_URL`、既定はローカル 5433）
  3. `E2E_AUTH_BYPASS=1 ALLOWED_EMAILS=e2e@example.com pnpm test:e2e`（Playwright が `pnpm dev` を自動起動し、その `DATABASE_URL` をテスト DB に固定する）
  - `pnpm dev` を別ターミナルで先に起動しておく場合は、**`DATABASE_URL` をテスト DB に明示**して起動する（`reuseExistingServer` により既存サーバーがそのまま使われ、`.env` の本番を読んだサーバーでも再利用されてしまうため）。

## カバレッジ

- 計測: `pnpm test:coverage`（Vitest + `@vitest/coverage-v8`）。対象はロジック層（`server/**` / `composables/**` / `repositories/**` / `schemas/**` / `lib/**` / `middleware/**`）。`.vue` の描画は E2E で担保するため計測対象外。
- 基準: ロジック層で Statements / Branches ともに **80% 以上**を維持する。
- 強制: `vitest.config.ts` の `coverage.thresholds` に設定済みで、下回るとコマンドが失敗する。CI は `pnpm test:coverage` を実行するため、閾値割れは**マージ前に検出される**（人手のレビュー任せにしない）。

## テストツール

| テスト種別 | ツール |
|-----------|--------|
| ユニットテスト | Vitest + @vue/test-utils / @nuxt/test-utils |
| 統合テスト（IT） | Vitest + Testcontainers（`@testcontainers/postgresql` + PostGIS） |
| カバレッジ | `@vitest/coverage-v8`（`pnpm test:coverage`） |
| E2E テスト | Playwright |
| スモークテスト | Playwright（起動確認・主要ページ表示） |

## テスト用 DB の接続先（破壊防止）

**テストは本番と同じ接続先環境変数（`DATABASE_URL`）を参照してはならない。** IT / E2E の seed は既存データを全削除することが多く、接続先を誤ると本番データが消える。本プロジェクトの `front/.env` は本番 Supabase を指しているため、`DATABASE_URL` を読む時点で本番に届き得る。

- 接続先の解決は **1 箇所に集約**する（`front/lib/test-database-url.ts`）。IT・E2E の双方がこの入口を通す。
  - E2E / seed: `resolveTestDatabaseUrl()` で解決する（`prisma/seed.ts` / `prisma/push-test-db.ts` / `playwright.config.ts` の `webServer.env`）。
  - IT: Testcontainers が払い出した URL を `assertLocalDatabaseUrl()` に通してから `db push` / `TRUNCATE` する（`vitest.it.global-setup.ts` / `vitest.it.setup.ts`）。
- 上書きは**テスト専用の環境変数**（`TEST_DATABASE_URL`）でのみ行う。既定値は `postgresql://stamped:stamped@localhost:5433/stamped`（`docker-compose.yml` の db サービス）。
- **ホストの allowlist で検証し、`localhost` / `127.0.0.1` / `::1` 以外なら接続前に throw する。** テストランナー起動時ではなく、**seed や migrate が走る前**に落とす。接続先を上書きできるクエリパラメータ（`host` / `hostaddr`）を含む URL も拒否する。
- 失敗メッセージには**解決されたホスト名**と**復旧手順**（テスト DB の起動コマンド `make db-up`、既定 URL）を含める。原因の特定に時間をかけさせない。
- **`process.env.X ?? ローカル既定` というフォールバックを書かない。** 「未設定なら安全側」に見えて、実際は「**値が入っていれば危険側**」に倒れる。安全な既定は allowlist（通すものを列挙し、他は落とす）である。
- ガード自体をテストする（既定値・localhost 許可・本番用変数が汚染されていても無視すること・リモート拒否・メッセージ内容）。`__tests__/lib/test-database-url.test.ts`。
- **シェルや CI の `env` で `DATABASE_URL` をジョブ全体に設定しない。** CI の e2e ジョブは `TEST_DATABASE_URL` だけをジョブ env に置き、アプリサーバーの起動ステップでのみ `DATABASE_URL="$TEST_DATABASE_URL"` を明示して渡す。

**なぜフォールバックが危険か**: ORM クライアント（Prisma 等）を import した時点で `.env` が `process.env` に読み込まれる実装がある。この場合 `process.env.DATABASE_URL ?? ローカル既定` は **`.env` の本番 URL を拾う**。しかもアプリ側と seed 側で評価タイミングが違うと、**アプリはローカルを読み、seed だけが本番を壊す**という非対称が起き、症状は「seed 依存テストが全滅」という形でしか現れない。

> **テストが不可解に全滅したら、まず接続先を疑う。** 原因を推測で決めつけて環境変数を手で固定し、先に進めてはならない。

同じ原則は DB 以外の破壊的操作にも適用する。テストやスクリプトが外部リソース（ストレージ、キュー、メール送信、決済 API 等）を消去・送信し得る場合は、接続先・宛先を allowlist で検証し、本番を指したら実行前に失敗させる。
