---
description: Nuxt.js 3 フロントエンド設計・コンポーネント規約
globs: "front/components/**,front/pages/**,front/composables/**,front/layouts/**,front/stores/**"
---

# フロントエンドルール（Nuxt.js 3）

## コンポーネント設計

- アトミックデザインの3層 `components/atoms/` ・ `components/molecules/` ・ `components/organisms/` に配置する（Issue #7 で採用）。
- 各層の配下に feature サブディレクトリを切る（例: `molecules/spot/`・`molecules/common/`・`organisms/spot/`・`organisms/map/`・`organisms/category/`）。
- `nuxt.config.ts` で `pathPrefix: false` を設定しているため、コンポーネント名はパスを含まずフラットに使用する（例: `<SpotPanel />`）。
- atoms は将来拡張用（現状は `.gitkeep` のみ）。

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
