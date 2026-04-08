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

明示的な指示がなくても、以下のルールを常に守ってください。

### 開発フロー

- **ブランチ運用**: 開発を開始する際は、必ず作業ブランチを切ってから着手する。main ブランチで直接作業しない。
- **テスト必須**: 実装時はテストコードも必ず書く。

### 品質ゲート

- **セルフレビュー必須**: 要求仕様の作成・ドキュメント生成・設計・実装が完了したら、次のフェーズに進む前にセルフレビューを実施する。
- **セルフレビュー後の修正**: セルフレビューで指摘を検出したら、修正まで実施する。
- **設計完了時**: 要求仕様との齟齬がないか確認し、ユーザーにレビューしてもらう。レビュー完了まで実装に進まない。
- **実装完了時**: 設計仕様との齟齬がないか確認し、ユーザーにレビューしてもらう。

### ドキュメント

- **ドキュメント更新**: 作業が完了したら、ルートドキュメント（CLAUDE.md / README.md / docs/）の更新が必要かどうか確認し、必要であれば更新する。

### ルールファイル

詳細なルールは `.claude/rules/` に格納されています。

| ファイル | スコープ | 内容 |
|---------|---------|------|
| `coding-standards.md` | 全体 | TypeScript strict / pnpm / ESLint + Prettier 規約 |
| `error-handling.md` | 全体 | バリデーション・HTTP ステータスコード・ログ方針 |
| `security.md` | 全体 | Supabase Auth / ALLOWED_EMAILS / Prisma インジェクション対策 |
| `testing.md` | `front/__tests__/**`, `front/tests/**` | Vitest + Playwright テスト方針 |
| `frontend.md` | `front/components/**`, `front/pages/**`, `front/composables/**` | Nuxt.js 3 コンポーネント・composables 設計規約 |
| `api.md` | `front/server/**` | Nuxt.js Server API 設計・ディレクトリ構成・バリデーション方針 |
| `database.md` | `front/prisma/**`, `front/server/utils/**` | Prisma 命名規約・マイグレーション・クエリ規約 |
