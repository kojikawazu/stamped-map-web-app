---
description: セキュリティ設計方針（認証・通信・インジェクション対策・シークレット管理）
globs: 
---

# セキュリティ

## 認証・認可

- 認証は Supabase Auth（JWT）を使用する。
- API エンドポイントごとにアクセス制御を設定する（公開 / 認証必須 / オーナー限定）。
- Write 操作（POST/PUT/DELETE）は `ALLOWED_EMAILS` によるオーナー検証を必須とする。

### E2E 認証バイパス（テスト専用シーム）

- 実 DB E2E のため、`server/utils/auth.ts` は `E2E_AUTH_BYPASS=1` のとき Supabase 検証を
  スキップして固定オーナーを返す **テスト専用シーム** を持つ。
- **本番では絶対に有効化しない。** 二重ガード:
  1. `E2E_AUTH_BYPASS === "1"`（本番 Vercel には設定しない）
  2. `VERCEL_ENV !== "production"`（万一設定されても本番ランタイムでは無効）
- 有効時はサーバーログに警告を出力する。設定するのは E2E（CI / ローカル）のみ。

## 通信・アクセス制御

- 全通信は **HTTPS** を必須とする（Vercel / Supabase ともにデフォルト）。
- **CORS**（将来予定 / 未実装）: 別オリジンからの利用を許可する場合は許可オリジンを明示指定する（`*` は本番で使用しない）。現状は同一オリジン運用のため未設定。
- **レートリミット**（将来予定 / 未実装）: 導入時は認証系エンドポイントを特に厳しく制限する。現状は未導入。

## インジェクション対策

- **SQL インジェクション**: Prisma ORM またはパラメータバインドを必須とする。生 SQL の文字列結合は禁止。
- **XSS**: Vue.js / Nuxt.js の自動エスケープ + ユーザー入力のサニタイズ。CSP ヘッダー設定は将来予定（未実装）。
- **CSRF**: Bearer Token 認証（Cookie に保存しない）のため CSRF トークン不要。

## シークレット管理

- ローカル環境: `.env.local`（`.gitignore` に追加必須）
- 本番環境: Vercel Environment Variables を使用
- **混入検出**: `.gitignore` は未追跡ファイルにしか効かず、push 済みの秘匿ファイルは履歴から消えない。CI の Secret scan（`.github/workflows/secret-scan.yml` → `scripts/check-tracked-secrets.sh`）で鍵・`.env` 系が追跡対象に入っていないかを常時検査する。
  - ワークフローを `paths` / `paths-ignore` で絞らない（どの変更でも混入しうる。必須チェック化した際に pending で PR がマージ不能になる）。
  - 検出パターンを変更したら `scripts/test-check-tracked-secrets.sh` に代表パスを追加する。
  - 検出された場合は追跡除外だけで済ませず、**鍵・トークンをローテーション**する。
