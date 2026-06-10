# ドキュメント索引

Stamped Map Web App の仕様・設計ドキュメント一覧。プロジェクト概要・セットアップ手順はリポジトリ直下の [`../README.md`](../README.md) を参照。

ドキュメントは 3 層で構成している。

- **標準仕様書（`01`〜`11`）** — 仕様の正準。番号順に読むと全体像をつかめる。
- **[`design/`](./design/)** — マイルストーン単位の設計判断・新機能設計（移行計画・OAuth・CRUD・UI 等）。
- **[`test-design/`](./test-design/)** — テスト設計の詳細ケース。

## 読み進め順（おすすめ）

`01 要求 → 02 要件 → 03 機能 → 05 データ → 06 セキュリティ → 07 API → 08 テスト → 09 アーキテクチャ`。
04・10・11 は随時参照。初めて環境構築する場合は [`../README.md`](../README.md#setup) のセットアップ手順から。

## 標準仕様書

| # | ドキュメント | 概要 |
|---|---|---|
| 01 | [要求仕様書](./01-business-requirements.md) | 背景・目的・スコープ・制約・決定事項 |
| 02 | [要件仕様書](./02-requirements-specification.md) | 機能要件・非機能要件・受け入れ条件 |
| 03 | [機能仕様書](./03-functional-specification.md) | 画面仕様・ユーザーフロー・カテゴリ/地図表現 |
| 04 | [非機能仕様書](./04-non-functional-specification.md) | パフォーマンス・可用性・運用 |
| 05 | [データ仕様書](./05-data-specification.md) | Prisma スキーマ・テーブル・ER図・インデックス |
| 06 | [セキュリティ仕様書](./06-security-specification.md) | 認証・認可・脆弱性対策・シークレット管理 |
| 07 | [API 仕様書](./07-api-specification.md) | Server API エンドポイント・リクエスト/レスポンス・エラー形式 |
| 08 | [テスト仕様書](./08-test-specification.md) | テスト戦略・ケース・テスト構成・CI |
| 09 | [アーキテクチャ仕様書](./09-architecture-specification.md) | 技術スタック・構成図・ディレクトリ・デプロイ |
| 10 | [その他仕様書](./10-miscellaneous-specification.md) | 用語集・補足事項 |
| 11 | [タスク](./11-tasks.md) | マイルストーン・完了実績・進捗 |

## design/ — 設計書（マイルストーン単位）

| ドキュメント | 概要 |
|---|---|
| [design-policy](./design/design-policy.md) | 開発設計方針 |
| [nuxt3-migration](./design/nuxt3-migration.md) | Next.js 16 → Nuxt.js 3 移行設計（M0） |
| [m2-oauth-google-design](./design/m2-oauth-google-design.md) | Google OAuth 認証設計（M2） |
| [m3-m4-phase1-design](./design/m3-m4-phase1-design.md) | 地図表示・CRUD 設計（M3 / M4） |
| [owner-only-crud](./design/owner-only-crud.md) | オーナー限定 CRUD 設計（Issue #33） |
| [ui-redesign](./design/ui-redesign.md) | UI リデザイン方針 |

## test-design/ — テスト設計

| ドキュメント | 対象 |
|---|---|
| [test-design](./test-design/test-design.md) | テストケースの洗い出し（設計） |

## その他

| ドキュメント | 内容 |
|---|---|
| [troubleshooting](./troubleshooting.md) | セットアップ・認証・DB・CI のハマりどころと対処 |

## 関連

- 開発フロー・コントリビュート: [`../CONTRIBUTING.md`](../CONTRIBUTING.md)
- 開発ルール: [`../CLAUDE.md`](../CLAUDE.md) と [`../.claude/rules/`](../.claude/rules/)
- ドキュメント更新の影響マップ: [`../.claude/rules/documentation.md`](../.claude/rules/documentation.md)
