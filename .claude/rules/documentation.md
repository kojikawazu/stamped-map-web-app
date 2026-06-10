---
description: ドキュメント更新・設計書管理ルール（影響マップ + opt-out の完了条件）
globs:
---

# ドキュメント

コード変更がドキュメント（CLAUDE.md / README.md / docs/）と乖離しないことを構造的に担保する。

## 完了条件（opt-out）

変更は、下記「影響マップ」の対応ドキュメントを**同一 PR 内で更新する**ことを完了条件とする。

- 更新不要と判断した場合は、**PR 説明にその理由を明記する**（省略＝未対応とみなす）。
- この乖離チェックは `/self-review` と `/pr-create` の確認対象に含まれる。

## 影響マップ（変更種別 → 更新必須ドキュメント）

「どのドキュメントだっけ？」を考えさせないための逆引き表。

| 変更種別 | 更新必須ドキュメント |
|---|---|
| Prisma スキーマ・テーブル/カラム変更 | `docs/05-data-specification.md`、`.claude/rules/database.md`（命名・共通フィールド規約に影響する場合） |
| Server API（`front/server/**`）のエンドポイント追加・変更 | `docs/07-api-specification.md`、`.claude/rules/api.md`（設計方針に影響する場合） |
| 認証・認可・アクセス制御（Supabase Auth / ALLOWED_EMAILS / owner-only CRUD） | `docs/06-security-specification.md`、`.claude/rules/security.md` |
| 画面・コンポーネント・UI（`front/components/**`, `front/pages/**`） | `docs/03-functional-specification.md`、`docs/design/ui-redesign.md`（UI 方針に関わる場合） |
| 機能要件・業務要件の変更 | `docs/01-business-requirements.md`、`docs/02-requirements-specification.md`、`docs/03-functional-specification.md` |
| 非機能要件（性能・可用性・運用）の変更 | `docs/04-non-functional-specification.md` |
| アーキテクチャ・技術スタック・ディレクトリ構成の変更 | `docs/09-architecture-specification.md`、`README.md`、`CLAUDE.md`（Rules テーブルに影響する場合） |
| テスト方針・テスト構成（Vitest / Playwright）の変更 | `docs/08-test-specification.md`、`docs/test-design/test-design.md`、`.claude/rules/testing.md` |
| 設計判断・新機能の設計（マイルストーン単位） | `docs/design/` 配下に設計書を追加・更新 |
| `.claude/rules/` のルール追加・削除・スコープ変更 | `CLAUDE.md` の Rules テーブル |
| Instruction Shortcuts の追加・変更 | `CLAUDE.md` の Instruction Shortcuts テーブル |

該当する変更がない場合はスキップする。
