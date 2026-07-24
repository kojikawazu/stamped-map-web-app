/**
 * API エラーコードの一覧。クライアントはこのコードで分岐する。
 *
 * 表示文言（`message`）は変わり得るためクライアント側の分岐条件に使わない。
 * 値と型をペアで持たせるため、型を導出する定数として types/ ではなくここに置く。
 */
export const API_ERROR_CODES = [
  /** 入力値がスキーマ・形式の検証に通らなかった（400） */
  "VALIDATION_ERROR",
  /** 対象リソースが存在しない（404） */
  "NOT_FOUND",
  /** 認証されていない・トークンが無効（401） */
  "UNAUTHORIZED",
  /** 認証済みだが操作が許可されていない（403） */
  "FORBIDDEN",
  /** サーバー内部エラー・設定不備（500） */
  "INTERNAL_ERROR",
  /** デフォルトカテゴリを削除しようとした（400） */
  "DEFAULT_CATEGORY_DELETE",
  /** スポットが紐づくカテゴリを削除しようとした（400） */
  "CATEGORY_IN_USE",
  /** 同名のカテゴリが既に存在する（400） */
  "DUPLICATE_CATEGORY",
] as const;

/**
 * API エラーコード。`API_ERROR_CODES` から導出する。
 */
export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

/**
 * 統一形式の API エラーを生成する。
 *
 * `error-handling.md` の「統一エラーレスポンス」に従い、すべてのエラーを
 * `{ statusCode, data: { code, message } }` の形に揃えるためのファクトリ。
 * `createError` を直接呼ぶと `data` を付け忘れて形状が崩れるため、
 * サーバー側のエラー生成は原則この関数を経由する。
 *
 * @param statusCode - 返す HTTP ステータスコード（400 / 401 / 403 / 404 / 500）
 * @param code - クライアントが分岐に使う機械可読なエラーコード
 * @param message - 利用者向けの日本語メッセージ。センシティブ情報を含めないこと
 * @returns h3 が送出できるエラーオブジェクト（呼び出し側で `throw` する）
 */
export function apiError(
  statusCode: number,
  code: ApiErrorCode,
  message: string,
) {
  return createError({ statusCode, data: { code, message } });
}
