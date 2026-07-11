# Stamped Map Web App — 開発タスクショートカット
#
# 前提: pnpm コマンドは front/ 配下で実行する。本 Makefile はルートから
# `make <target>` で各操作を呼べるよう cd を吸収する。
# 一覧は `make` または `make help` で確認できる。

# --- 設定 ---------------------------------------------------------------
FRONT := front

# ローカル E2E 用 PostGIS（docker-compose.yml の db サービス, 5433 公開）
E2E_DATABASE_URL ?= postgresql://stamped:stamped@localhost:5433/stamped
E2E_BASE_URL     ?= http://localhost:3000
# E2E は Supabase 検証をバイパスし固定オーナーで動かす（本番では絶対に有効化しない）
E2E_ENV := E2E_AUTH_BYPASS=1 ALLOWED_EMAILS=e2e@example.com \
	DATABASE_URL=$(E2E_DATABASE_URL) PLAYWRIGHT_BASE_URL=$(E2E_BASE_URL)

.DEFAULT_GOAL := help

# --- ヘルプ -------------------------------------------------------------
.PHONY: help
help: ## このヘルプを表示
	@awk 'BEGIN {FS = ":.*##"; printf "\nTargets:\n"} \
		/^[a-zA-Z0-9_-]+:.*##/ {printf "  \033[36m%-16s\033[0m %s\n", $$1, $$2} \
		/^##@/ {printf "\n\033[1m%s\033[0m\n", substr($$0, 5)}' $(MAKEFILE_LIST)
	@echo ""

##@ セットアップ / 開発
.PHONY: install dev build preview
install: ## 依存パッケージをインストール
	cd $(FRONT) && pnpm install

dev: ## 開発サーバー起動（http://localhost:3000）
	cd $(FRONT) && pnpm dev

build: ## 本番ビルド（prisma generate 含む）
	cd $(FRONT) && pnpm build

preview: ## ビルド成果物をプレビュー
	cd $(FRONT) && pnpm preview

##@ 品質ゲート
.PHONY: check type-check lint format format-check
check: type-check lint format-check test ## CI 相当の一括チェック（型 + Lint + 整形 + UT）

type-check: ## 型チェック（nuxt typecheck = vue-tsc）
	cd $(FRONT) && pnpm type-check

lint: ## ESLint（JSDoc ルール含む）
	cd $(FRONT) && pnpm lint

format: ## Prettier で整形を適用
	cd $(FRONT) && pnpm format

format-check: ## Prettier 整形チェック（変更なし確認）
	cd $(FRONT) && pnpm format:check

##@ テスト
.PHONY: test test-coverage test-it
test: ## ユニット/結合テスト（Vitest, prisma モック）
	cd $(FRONT) && pnpm test

test-coverage: ## カバレッジ計測（@vitest/coverage-v8）
	cd $(FRONT) && pnpm test:coverage

test-it: ## 統合テスト（IT, Testcontainers で実 PostGIS）※Docker 必須
	cd $(FRONT) && pnpm test:it

##@ データベース（開発用 / front/.env.local を使用）
.PHONY: db-push db-seed
db-push: ## Prisma スキーマを DB に同期（db push）
	cd $(FRONT) && pnpm exec prisma db push

db-seed: ## シードデータ投入
	cd $(FRONT) && pnpm db:seed

##@ E2E（実 DB シナリオ / ローカル PostGIS 5433）
.PHONY: e2e e2e-full e2e-setup db-up db-down db-logs
db-up: ## ローカル PostGIS を起動（healthy まで待機）
	docker compose up -d --wait

db-down: ## ローカル PostGIS を停止・破棄
	docker compose down -v

db-logs: ## ローカル PostGIS のログを表示
	docker compose logs -f db

e2e-setup: ## E2E 用 DB へスキーマ同期 + シード投入（5433 に対して）
	cd $(FRONT) && DATABASE_URL=$(E2E_DATABASE_URL) pnpm exec prisma db push \
		&& DATABASE_URL=$(E2E_DATABASE_URL) pnpm db:seed

e2e: ## E2E テスト実行（Playwright が pnpm dev を自動起動）
	cd $(FRONT) && $(E2E_ENV) pnpm test:e2e

e2e-full: db-up e2e-setup e2e ## E2E をフルセットアップ込みで実行（DB 起動 → 同期/シード → テスト）
