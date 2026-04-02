import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { H3Event } from "h3";

// フロントエンドは Authorization: Bearer <token> ヘッダーで認証する設計のため、
// @nuxtjs/supabase の serverSupabaseClient（Cookie セッション前提）ではなく
// createClient + getUser(token) を使用する。
// HTTP サーバーは長寿命のため、モジュールレベルで singleton 化してリクエストごとの生成を避ける。
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseAdmin(): SupabaseClient {
  if (!_supabaseAdmin) {
    const url = process.env.NUXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw createError({ statusCode: 500, message: "サーバー設定エラー" });
    }
    _supabaseAdmin = createClient(url, key);
  }
  return _supabaseAdmin;
}

export async function verifyAuth(event: H3Event) {
  const token = getHeader(event, "authorization")?.replace("Bearer ", "");
  if (!token) {
    throw createError({ statusCode: 401, message: "認証が必要です" });
  }

  const supabase = getSupabaseAdmin();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw createError({ statusCode: 401, message: "認証が無効です" });
  }

  return user;
}
