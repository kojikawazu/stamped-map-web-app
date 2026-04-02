import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { H3Event } from "h3";

// フロントエンドは Authorization: Bearer <token> ヘッダーで認証する設計のため、
// @nuxtjs/supabase の serverSupabaseClient（Cookie セッション前提）ではなく
// createClient + getUser(token) を使用する。
// HTTP サーバーは長寿命のため、モジュールレベルで singleton 化してリクエストごとの生成を避ける。
// JWT 検証専用クライアント（ANON_KEY は auth.getUser() の検証用途のみ）
// 名称を _supabaseAuth とし、管理操作（SERVICE_ROLE_KEY）との混同を防ぐ
let _supabaseAuth: SupabaseClient | null = null;

function getSupabaseAuth(): SupabaseClient {
  if (!_supabaseAuth) {
    const url = process.env.NUXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw createError({ statusCode: 500, message: "サーバー設定エラー" });
    }
    _supabaseAuth = createClient(url, key);
  }
  return _supabaseAuth;
}

export async function verifyAuth(event: H3Event) {
  const token = getHeader(event, "authorization")?.replace("Bearer ", "");
  if (!token) {
    throw createError({ statusCode: 401, message: "認証が必要です" });
  }

  const supabase = getSupabaseAuth();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw createError({ statusCode: 401, message: "認証が無効です" });
  }

  return user;
}
