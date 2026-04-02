import { createClient } from "@supabase/supabase-js";
import type { H3Event } from "h3";

// フロントエンドは Authorization: Bearer <token> ヘッダーで認証する設計のため、
// @nuxtjs/supabase の serverSupabaseClient（Cookie セッション前提）ではなく
// createClient + getUser(token) を使用する。
export async function verifyAuth(event: H3Event) {
  const token = getHeader(event, "authorization")?.replace("Bearer ", "");
  if (!token) {
    throw createError({ statusCode: 401, message: "認証が必要です" });
  }

  const supabaseUrl = process.env.NUXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NUXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw createError({ statusCode: 500, message: "サーバー設定エラー" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw createError({ statusCode: 401, message: "認証が無効です" });
  }

  return user;
}
