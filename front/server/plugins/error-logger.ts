/**
 * サーバーの想定外エラーをスタックトレース付きで記録する Nitro プラグイン。
 *
 * `error-handling.md` の「エラー時はスタックトレースを含むログを出力する」を、
 * 各ハンドラーに `try/catch` を散在させずに満たすため、Nitro の `error` フックで
 * 一元的に受ける。
 *
 * 意図的に投げた 4xx（`apiError` 由来のバリデーション・認証・認可エラー）は
 * 正常な業務フローでありノイズになるため記録しない。記録するのは 5xx と、
 * ステータスを持たない想定外の例外（Prisma の DB エラー等）に限る。
 */
export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook("error", (error, { event }) => {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;

    // 意図的な 4xx は業務上の正常系。ログには残さない。
    if (statusCode < 500) return;

    // リクエスト本体・ヘッダー（Authorization）・環境変数は出力しない。
    // メソッドとパスだけでも障害箇所は特定でき、センシティブ情報の混入を避けられる
    // （security.md「センシティブ情報はログに含めない」）。
    const where = event ? `${event.method} ${event.path}` : "(no event)";

    console.error(
      `[api] ${statusCode} ${where}`,
      error instanceof Error ? error.stack : error,
    );
  });
});
