# トラブルシューティング

## 目次

- [セットアップ](#セットアップ)
  - [環境変数名を間違えている](#環境変数名を間違えている)
  - [地図が表示されない / タイルが真っ白](#地図が表示されない--タイルが真っ白)
- [認証・ログイン](#認証ログイン)
  - [ログインできない / サインアップ画面がない](#ログインできない--サインアップ画面がない)
  - [Google ログインがリダイレクトエラーになる](#google-ログインがリダイレクトエラーになる)
  - [ログインできるのに登録・編集・削除ボタンが出ない](#ログインできるのに登録編集削除ボタンが出ない)
  - [`@nuxtjs/supabase` の redirect オプションでエラー](#nuxtjssupabase-の-redirect-オプションでエラー)
- [データベース](#データベース)
  - [`prisma migrate` 系コマンドが想定外の挙動をする](#prisma-migrate-系コマンドが想定外の挙動をする)
  - [PostGIS 関連のエラー](#postgis-関連のエラー)
  - [シードが流れない](#シードが流れない)
- [CI / E2E](#ci--e2e)
  - [E2E が CI で起動待ちタイムアウトする](#e2e-が-ci-で起動待ちタイムアウトする)
  - [ユニットテストが環境変数で落ちる](#ユニットテストが環境変数で落ちる)

セットアップ・開発・CI でハマりやすい点と対処。

## セットアップ

### 環境変数名を間違えている

- Supabase は **`SUPABASE_URL` / `SUPABASE_KEY`**（`@nuxtjs/supabase` が読む名）。`NUXT_PUBLIC_SUPABASE_URL` などの名前では読まれない。
- Prisma は **`DATABASE_URL` / `DIRECT_URL`** を直接参照する（`front/prisma/schema.prisma`）。
- MapTiler はクライアント公開のため **`NUXT_PUBLIC_MAPTILER_KEY`**。
- 正しい一覧は [`../README.md`](../README.md#2-環境変数の設定) と `front/.env.example` を参照。

### 地図が表示されない / タイルが真っ白

- `NUXT_PUBLIC_MAPTILER_KEY` が未設定か無効。MapTiler Cloud の API Key を確認。
- 地図コンポーネントは `<ClientOnly>` でラップされ CSR でのみ描画される。SSR では描画されないのが正常。

## 認証・ログイン

### ログインできない / サインアップ画面がない

- **サインアップ機能は提供していない。** Supabase ダッシュボード → Authentication → Users → Add user で事前にアカウントを作成する。
- Supabase 側で公開サインアップ（Enable sign-ups）は無効化する想定。

### Google ログインがリダイレクトエラーになる

- Google Cloud Console の承認済みリダイレクト URI に `https://<project-ref>.supabase.co/auth/v1/callback` が登録されているか確認。
- Supabase の Authentication → Providers → Google が有効で、クライアント ID / シークレットが登録されているか確認。
- リダイレクト先がずれる場合は `NUXT_PUBLIC_SITE_URL` を設定（未設定時は `window.location.origin` にフォールバック）。
- 設計の詳細: [`design/m2-oauth-google-design.md`](design/m2-oauth-google-design.md)。

### ログインできるのに登録・編集・削除ボタンが出ない

- 仕様通り。Write 操作はオーナー限定で、ログインユーザーのメールが `ALLOWED_EMAILS` に含まれない場合は `/api/me/is-owner` が `false` を返し、Write 操作 UI が非表示になる。
- 自分をオーナーにするには `.env.local` の `ALLOWED_EMAILS` にメールを追加（カンマ区切り）。

### `@nuxtjs/supabase` の redirect オプションでエラー

- バージョンにより名称が異なる（v1 系: `redirect` / v2 系: `redirectOptions`）。`front/nuxt.config.ts` のコメント参照。導入バージョンに合わせて設定する。

## データベース

### `prisma migrate` 系コマンドが想定外の挙動をする

- このプロジェクトは **マイグレーションファイルを持たない**。`prisma migrate dev` ではなく **`prisma db push`** でスキーマを DB に同期する。
- 詳細: [`05-data-specification.md`](05-data-specification.md#prisma-スキーマ)。

### PostGIS 関連のエラー

- Supabase プロジェクトで PostGIS 拡張を有効化しておく（`CREATE EXTENSION IF NOT EXISTS postgis;`）。
- なお `location` 生成カラム・GIST インデックスは現状未実装。空間検索は未使用。

### シードが流れない

- `pnpm db:seed` は `DATABASE_URL`（PgBouncer 経由）を使用する。未設定だとエラー。
- デフォルトカテゴリは upsert。ダミースポットはスポットが 0 件のときのみ投入される。

## CI / E2E

### E2E が CI で起動待ちタイムアウトする

- E2E ジョブは `pnpm build` 後に本番サーバー（`node .output/server/index.mjs`）をダミー環境変数で起動し、`http://127.0.0.1:3000` の応答を待ってから Playwright を実行する。
- 起動ログは `/tmp/nitro.log` に出力され、待機失敗時に CI ログへダンプされる。サーバーが起動しない場合はまずこのログを確認。
- ローカルで E2E を回す場合は `pnpm dev`（または `pnpm build && pnpm preview`）でサーバーを起動した状態で `pnpm test:e2e`。

### ユニットテストが環境変数で落ちる

- CI のユニットジョブはダミーの `SUPABASE_URL` / `SUPABASE_KEY` / `NUXT_PUBLIC_MAPTILER_KEY` を渡している。ローカルでも同名の値が `.env.local` にあれば足りる。
