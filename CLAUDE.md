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
| `github-issue.md` | 全体 | GitHub issue 駆動開発（ブランチと対で起票・PR で自動クローズ） |
| `documentation.md` | 全体 | ドキュメント更新の影響マップ・opt-out 完了条件 |
| `coding-standards.md` | 全体 | TypeScript strict / pnpm / ESLint + Prettier 規約 |
| `typescript.md` | `front/**/*.ts`, `front/**/*.vue` | type/interface の使い分け・型/定数の配置・any 禁止・`import type` |
| `jsdoc.md` | `front/components/**`, `front/composables/**`, `front/repositories/**`, `front/schemas/**`, `front/server/**`, `front/lib/**`, `front/middleware/**` | TypeScript 公開シンボルへの JSDoc（TSDoc）必須・型ブレース禁止 |
| `error-handling.md` | 全体 | バリデーション・HTTP ステータスコード・ログ方針・判定不能を正常値に丸めない |
| `security.md` | 全体 | Supabase Auth / ALLOWED_EMAILS / Prisma インジェクション対策 |
| `production-data.md` | 全体 | 本番データ保護（本番 DB への破壊的操作の禁止・環境分離・例外手順・AI エージェントへの制約） |
| `testing.md` | `front/__tests__/**`, `front/tests/**` | Vitest + Playwright テスト方針 |
| `frontend.md` | `front/components/**`, `front/pages/**`, `front/composables/**`, `front/repositories/**`, `front/schemas/**` | Nuxt.js 3 コンポーネント・composables 設計規約・関心別ディレクトリ・レイヤ一方向依存 |
| `api.md` | `front/server/**` | Nuxt.js Server API 設計・ディレクトリ構成・バリデーション方針 |
| `database.md` | `front/prisma/**`, `front/server/utils/**` | Prisma 命名規約・監査列の自動設定・スキーマ同期（本番は変更しない）・クエリ規約 |
| `vercel.md` | `vercel.json` | Vercel デプロイ制御（ブランチ単位の発火制御・ビルドスキップの是非） |
| `github-actions.md` | `.github/workflows/**` | GitHub Actions 規約（push トリガ・concurrency・パスフィルタ・actionlint・Dependabot） |
| `static-analysis.md` | 全体 | 静的解析の運用（Formatter / Linter の役割分担・CI 必須・警告ゼロ・抑制コメント・markdownlint / shellcheck / 秘匿ファイル検出） |
| `duplication.md` | 全体 | 重複と共通化の判断基準（同じ知識だけ共通化・3 回目で共通化・初期化手順の一元化） |
| `dead-code.md` | 全体 | デッドコード禁止（コメントアウト・未使用・スキップ放置テストを残さない） |
| `pr-description.md` | 全体 | PR 本文の必須セクション（変更種別ごと。`ドキュメント` 種別はドキュメントのみの PR に限る） |
| `lessons-learned.md` | 全体 | 誤り・ハマりの教訓を `docs/lessons-learned.md` に蓄積する運用・ルールへの昇格基準 |
