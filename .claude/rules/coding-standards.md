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

## 依存パッケージの管理

- **更新は Dependabot に任せる**（`.github/dependabot.yml` の npm、`front/`・週次）。minor / patch は 1 本の PR にまとめ、major はパッケージごとの個別 PR で受け取り、リリースノートで破壊的変更を確認してから上げる。
- **lockfile を放置しない。** 指定範囲内の更新を溜めると、間接依存の脆弱性 alert が積み上がる（#112 では 146 件まで溜まり、範囲内の更新だけで大半が解消した）。
- **間接依存の脆弱性を `pnpm.overrides` で直すのは、同じメジャー（0.x は同じマイナー）の修正版に上げる場合に限る。** メジャーを跨ぐ override は、依存元が想定していない版を差し込むことになるため入れない（依存元の更新を待つか、影響を評価して dismiss する）。
  - `package.json` にはコメントを書けないため、追加した override の理由は PR 本文に残す。
  - **範囲指定の override（`pkg@<x.y.z`）は、他パッケージの peer 指定まで書き換える。** peer の範囲が狭まって「peer 未充足」の警告が出たら、その override は外す。
  - pnpm が自動で入れる peer（auto-install-peers）は override で版を変えられないことがある。その場合は、該当パッケージを直接依存として明示する（例: `vite`）。
- **コードが直接使う型パッケージは、自分の依存として明示する。** 他パッケージ経由で偶然見えている `@types/*` に頼らない（Nuxt の生成する `tsconfig` は `types: []` のため、グローバルの型名前空間は自動で読み込まれない）。
