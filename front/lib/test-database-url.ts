/**
 * テスト用 DB（IT / E2E / seed）の接続先を解決・検証する。
 *
 * `front/.env` は本番 Supabase を指しており、Prisma Client は import 時に `.env` を
 * `process.env` に読み込む。そのため `DATABASE_URL` は「未設定なら安全」ではなく
 * 「ほぼ常に本番が入っている」前提で扱い、ここでは一切参照しない（testing.md
 * 「テスト用 DB の接続先（破壊防止）」）。
 *
 * seed（tsx）・playwright.config.ts・Vitest の IT セットアップから相対 import されるため、
 * Nuxt のエイリアスや auto-import に依存しない。
 */

/** テスト DB の既定接続先。リポジトリ直下の docker-compose.yml（db サービス, 5433 公開）と一致させる */
const DEFAULT_TEST_DATABASE_URL =
  "postgresql://stamped:stamped@localhost:5433/stamped";

/** 接続を許可するホスト。ループバック以外はすべて拒否する（列挙したものだけを通す） */
const ALLOWED_HOSTS: readonly string[] = ["localhost", "127.0.0.1", "::1"];

/**
 * URL のホスト部より優先して接続先を上書きできるクエリパラメータ。
 * libpq / pg-connection-string は `?host=` を接続先として解釈するため、
 * ホスト部が localhost でもこれがあれば実際の接続先はリモートになり得る。
 */
const HOST_OVERRIDE_PARAMS: readonly string[] = ["host", "hostaddr"];

/** 失敗時に提示する復旧手順 */
const RECOVERY_HINT = [
  "テスト DB はローカルのコンテナのみ許可しています。",
  "  1. テスト DB を起動: make db-up（= docker compose up -d --wait）",
  `  2. 既定の接続先: ${DEFAULT_TEST_DATABASE_URL}`,
  "  3. 別のローカル DB を使う場合は TEST_DATABASE_URL で上書きしてください（DATABASE_URL は参照しません）。",
].join("\n");

/**
 * 接続先がループバック（localhost / 127.0.0.1 / ::1）であることを検証する。
 *
 * seed・`db push`・`TRUNCATE` など破壊的な操作の**前**に呼ぶこと。
 * メッセージには解決されたホストのみを含め、URL 全体（パスワード）は出力しない。
 *
 * @param url - 検証する PostgreSQL 接続 URL
 * @returns 検証を通過した URL（入力そのまま）
 * @throws {Error} URL を解析できない場合、ホストが allowlist 外の場合、
 *   クエリパラメータで接続先を上書きしている場合
 */
export function assertLocalDatabaseUrl(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error(
      `[test-db guard] テスト DB の接続 URL を解析できません。\n${RECOVERY_HINT}`,
    );
  }

  // Node の URL は IPv6 を "[::1]" と角括弧付きで返すため外してから比較する。
  const host = parsed.hostname.replace(/^\[(.*)\]$/, "$1").toLowerCase();
  if (!ALLOWED_HOSTS.includes(host)) {
    throw new Error(
      `[test-db guard] テスト DB の接続先がローカルではありません（host: ${host || "(空)"}）。\n${RECOVERY_HINT}`,
    );
  }

  for (const param of HOST_OVERRIDE_PARAMS) {
    const override = parsed.searchParams.get(param);
    if (override !== null) {
      throw new Error(
        `[test-db guard] クエリパラメータで接続先を上書きする URL は使用できません（${param}=${override}）。\n${RECOVERY_HINT}`,
      );
    }
  }

  return url;
}

/**
 * E2E / seed 用のテスト DB 接続先を解決し、ローカルであることを検証して返す。
 *
 * 上書きはテスト専用の `TEST_DATABASE_URL` のみ受け付け、`DATABASE_URL` は参照しない。
 * 空文字は未設定とみなす。既定値へのフォールバック後も必ず allowlist 検証を通すため、
 * 「値が入っていれば危険側に倒れる」フォールバックにはならない。
 *
 * @param env - 参照する環境変数（既定は `process.env`。テストから差し替えるための引数）
 * @returns 検証済みのテスト DB 接続 URL
 * @throws {Error} 解決した接続先がローカルでない場合（{@link assertLocalDatabaseUrl}）
 */
export function resolveTestDatabaseUrl(
  env: NodeJS.ProcessEnv = process.env,
): string {
  return assertLocalDatabaseUrl(
    env.TEST_DATABASE_URL || DEFAULT_TEST_DATABASE_URL,
  );
}
