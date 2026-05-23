# Stamped Map Web App

## Project Instructions

## Instruction Shortcuts

以下の短い指示は、対応するフルアクションとして解釈・実行してください。

| 指示 | アクション |
|------|-----------|
| PR承認しました | main ブランチを pull → マージ済みブランチを削除 → main に切り替え |
| PR出して | 変更をコミット → push → PR 作成 |
| Copilotにレビュー依頼出して | PR のコメントで `@copilot` メンション付きでレビュー依頼を投稿 |
| Copilotからレビュー来ました | PR のレビューコメントを取得・内容を確認・必要な対応を実施 |
| 〇〇を参考にしてください | 参考先は **read-only**（参考先のファイルやリポジトリを変更しない） |

## Rules

詳細なルールは `.claude/rules/` に格納されています。明示的な指示がなくても、以下のルールファイルを常に守ってください。

| ファイル | スコープ | 内容 |
|---------|---------|------|
| `workflow.md` | 全体 | ブランチ運用・セルフレビュー・ドキュメント更新 |
| `coding-standards.md` | 全体 | TypeScript strict / pnpm / ESLint + Prettier 規約 |
| `error-handling.md` | 全体 | バリデーション・HTTP ステータスコード・ログ方針 |
| `security.md` | 全体 | Supabase Auth / ALLOWED_EMAILS / Prisma インジェクション対策 |
| `testing.md` | `front/__tests__/**`, `front/tests/**` | Vitest + Playwright テスト方針 |
| `frontend.md` | `front/components/**`, `front/pages/**`, `front/composables/**` | Nuxt.js 3 コンポーネント・composables 設計規約 |
| `api.md` | `front/server/**` | Nuxt.js Server API 設計・ディレクトリ構成・バリデーション方針 |
| `database.md` | `front/prisma/**`, `front/server/utils/**` | Prisma 命名規約・マイグレーション・クエリ規約 |
