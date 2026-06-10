# コントリビューションガイド

Stamped Map Web App の開発フロー・規約。セットアップ手順は [`README.md`](README.md) を参照。

## 開発フロー

1. **ブランチを切る** — `main` で直接作業しない。用途に応じた prefix を付ける。
   - `feature/<name>` … 新機能
   - `fix/<name>` … バグ修正
   - `chore/<name>` … 雑務・設定
   - `docs/<name>` … ドキュメント
2. **実装 + テスト** — 実装と同時にテストを書く（テストファースト推奨）。
3. **セルフレビュー** — コミット前に差分を見直し、指摘を自分で修正する。
4. **品質ゲートを通す** — `pnpm lint` / `pnpm test` / `pnpm test:e2e` がローカルで通ることを確認。
5. **PR を作成** — `main` に向けて Pull Request を出す。CI（lint・unit・E2E）が通ること。

> CI は `feature/**` `fix/**` `chore/**` ブランチへの push と `main` への PR で発火する（[`.github/workflows/ci.yml`](.github/workflows/ci.yml)）。

## コマンド

すべて `front/` ディレクトリで実行する。

```bash
cd front

pnpm dev          # 開発サーバー
pnpm build        # 本番ビルド
pnpm test         # Vitest（ユニット/結合）
pnpm test:watch   # Vitest ウォッチ
pnpm test:e2e     # Playwright（E2E）
pnpm test:e2e:ui  # Playwright UI モード
pnpm lint         # ESLint
pnpm db:seed      # シードデータ投入
```

## コーディング規約

詳細は [`.claude/rules/`](.claude/rules/) を参照（要点）。

- **言語**: TypeScript strict。**パッケージマネージャ**: pnpm（npm/yarn 不可）。
- **フロント**: コンポーネントはアトミックデザイン（`atoms` / `molecules` / `organisms`）。ロジックは `composables/` に分離。フォームは Zod バリデーション。
- **API**: Server API（`server/api/`）は薄く保ち、共通処理は `server/utils/` へ。全エンドポイントで認証（GET=`verifyAuth` / Write=`verifyOwner`）。
- **DB**: Prisma のパラメータバインドを使用（`$queryRaw` の文字列結合は禁止）。モデルは PascalCase 単数形 + `@@map` で snake_case 複数形。
- **セキュリティ**: シークレットをハードコードしない（`.env.local` / Vercel 環境変数）。Write 操作は `ALLOWED_EMAILS` でオーナー検証。

## テスト方針

- 実装時はテストコードも必ず書く。モックは最小限にとどめる。
- ユニット/結合: Vitest（`front/__tests__/**`）。
- E2E/スモーク: Playwright（`front/tests/e2e/**`、Base URL `http://localhost:3000`）。

## ドキュメント更新（必須）

コード変更がドキュメントと乖離しないよう、変更種別ごとに更新すべきドキュメントを [`.claude/rules/documentation.md`](.claude/rules/documentation.md) の **影響マップ**で逆引きできる。

- 該当ドキュメントは**同一 PR 内で更新する**。
- 更新不要と判断した場合は **PR 説明にその理由を明記**する（省略＝未対応とみなす）。

## ライセンス

コントリビューションは [MIT License](LICENSE) の下で公開されることに同意したものとみなす。
