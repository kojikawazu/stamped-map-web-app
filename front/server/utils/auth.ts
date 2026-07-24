import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { H3Event } from "h3";

// --- E2E 認証バイパス（実 DB E2E 専用） ---
// サーバー API は Bearer JWT を Supabase で検証するため、実 DB E2E では Supabase 依存になる。
// これを避けるため、明示的な環境変数が立っているときだけ Supabase 検証をスキップし、
// 固定のオーナーとして扱う「テスト用シーム」を設ける。
//
// ⚠️ 本番では絶対に有効化しないこと。二重ガード:
//   1) E2E_AUTH_BYPASS === "1"（本番の Vercel には設定しない）
//   2) VERCEL_ENV !== "production"（万一設定されても本番ランタイムでは無効）
const E2E_TEST_USER = { id: "e2e-owner", email: "e2e@example.com" } as const;

let _e2eBypassWarned = false;

function isE2EAuthBypass(): boolean {
  const on =
    process.env.E2E_AUTH_BYPASS === "1" &&
    process.env.VERCEL_ENV !== "production";
  if (on && !_e2eBypassWarned) {
    _e2eBypassWarned = true;
    console.warn(
      "[auth] E2E_AUTH_BYPASS is ON — Supabase 認証をスキップしています。本番では絶対に有効化しないでください。",
    );
  }
  return on;
}

// フロントエンドは Authorization: Bearer <token> ヘッダーで認証する設計のため、
// @nuxtjs/supabase の serverSupabaseClient（Cookie セッション前提）ではなく
// createClient + getUser(token) を使用する。
// HTTP サーバーは長寿命のため、モジュールレベルで singleton 化してリクエストごとの生成を避ける。
// JWT 検証専用クライアント（ANON_KEY は auth.getUser() の検証用途のみ）
// 名称を _supabaseAuth とし、管理操作（SERVICE_ROLE_KEY）との混同を防ぐ
let _supabaseAuth: SupabaseClient | null = null;

function getSupabaseAuth(): SupabaseClient {
  if (!_supabaseAuth) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_KEY;
    if (!url || !key) {
      throw apiError(500, "INTERNAL_ERROR", "サーバー設定エラー");
    }
    _supabaseAuth = createClient(url, key);
  }
  return _supabaseAuth;
}

/**
 * リクエストの Bearer トークンを Supabase で検証し、認証済みユーザーを返す。
 *
 * すべての API エンドポイントの入口で呼ぶ。`E2E_AUTH_BYPASS` が有効な場合のみ
 * Supabase 検証をスキップして固定のテストユーザーを返す（本番では無効）。
 *
 * @param event - 検証対象のリクエストイベント。`Authorization` ヘッダーを読む
 * @returns 認証済みの Supabase ユーザー
 * @throws 401 `UNAUTHORIZED` — トークンが未送信・無効・期限切れの場合
 * @throws 500 `INTERNAL_ERROR` — SUPABASE_URL / SUPABASE_KEY が未設定の場合
 */
export async function verifyAuth(event: H3Event) {
  if (isE2EAuthBypass()) {
    // E2E_TEST_USER は id / email だけを持つ部分実装で、Supabase の User 型は
    // 構造的にこれより遥かに大きいため直接代入できず、二段キャストで隙間を埋める。
    // バイパス経路で実際に読まれるのは email のみ（is-owner.get.ts のオーナー判定）で、
    // verifyOwner はバイパス時に ALLOWED_EMAILS 検証ごとスキップする。
    // 他フィールドは実行時に触られないため部分実装で足りる。
    return E2E_TEST_USER as unknown as User;
  }

  const token = getHeader(event, "authorization")?.replace("Bearer ", "");
  if (!token) {
    throw apiError(401, "UNAUTHORIZED", "認証が必要です");
  }

  const supabase = getSupabaseAuth();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw apiError(401, "UNAUTHORIZED", "認証が無効です");
  }

  return user;
}

/**
 * 環境変数 `ALLOWED_EMAILS` からオーナーのメールアドレス一覧を取得する。
 *
 * カンマ区切りの値を分割し、前後空白の除去と小文字化を行う
 * （比較時の表記ゆれを防ぐため）。未設定なら空配列を返し、
 * 結果としてすべてのユーザーが非オーナー扱いになる。
 *
 * @returns 小文字に正規化されたメールアドレスの配列
 */
export function getAllowedEmails(): string[] {
  return (process.env.ALLOWED_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * 認証に加えて、ユーザーが書き込み権限を持つオーナーかを検証する。
 *
 * すべての書き込み系エンドポイント（POST / PUT / DELETE）の入口で呼ぶ。
 * DB へ到達する前に弾くことで、非オーナーによる更新を防ぐ。
 *
 * @param event - 検証対象のリクエストイベント
 * @returns オーナーとして検証済みの Supabase ユーザー
 * @throws 403 `FORBIDDEN` — `ALLOWED_EMAILS` に含まれないユーザーの場合
 * @throws 401 `UNAUTHORIZED` / 500 `INTERNAL_ERROR` — `verifyAuth` から伝播
 */
export async function verifyOwner(event: H3Event) {
  const user = await verifyAuth(event);

  // バイパス時は verifyAuth が固定オーナーを返すため、ALLOWED_EMAILS チェックもスキップする。
  if (isE2EAuthBypass()) {
    return user;
  }

  const allowedEmails = getAllowedEmails();

  if (!allowedEmails.includes((user.email ?? "").toLowerCase())) {
    throw apiError(403, "FORBIDDEN", "操作が許可されていません");
  }

  return user;
}
