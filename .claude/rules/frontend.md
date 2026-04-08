---
description: Nuxt.js 3 フロントエンド設計・コンポーネント規約
globs: "front/components/**,front/pages/**,front/composables/**,front/layouts/**,front/stores/**"
---

# フロントエンドルール（Nuxt.js 3）

## コンポーネント設計

- 共通 UI は `components/ui/`（Atoms）+ `components/common/`（Molecules）に配置
- 機能別コンポーネントは feature ディレクトリに配置（例: `components/spot/`, `components/map/`）

## ロジック分離

- ロジックは `composables/` に切り出す。コンポーネントは UI 描画に専念する。
- Nuxt 3 の auto-import を活用する（`composables/`, `utils/` は自動インポート対象）。

## ルーティング

- `pages/` ディレクトリによるファイルベースルーティングを使用する。
- ルートファイルを手動で定義しない。

## バリデーション

- フォームバリデーションには Zod スキーマバリデーションを使用する。

## テスト

- E2E: Playwright（`front/tests/` ディレクトリ）
- Base URL: `http://localhost:3000`
