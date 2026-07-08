---
description: コーディング規約
globs: 
---

# コーディング規約

- **言語**: TypeScript strict モード（`typescript: { strict: true }`）
- **パッケージマネージャ**: pnpm を使用（npm / yarn は使用しない）
- **Linter / Formatter**: ESLint（`@nuxt/eslint` の flat config、`front/eslint.config.mjs`）+ Prettier（`prettier-plugin-tailwindcss` 併用）でコード品質を担保。TypeScript 公開シンボルの JSDoc は `eslint-plugin-jsdoc` で機械強制する（[jsdoc.md](./jsdoc.md) 参照）。ESLint と Prettier の整形ルール競合は `eslint-config-prettier` で回避する。
- **型チェック**: `pnpm type-check`（`nuxt typecheck` = vue-tsc）で `tsc --noEmit` 相当の検証を行う。
- **CI 品質ゲート**: `type-check` / `lint` / `format:check` / `test` を CI（`.github/workflows/ci.yml`）で必須実行する。
- **環境変数**: 設定値は環境変数で管理（.env.local）
- **シークレット禁止**: シークレット・認証情報をハードコードしない
