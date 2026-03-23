import { supabase } from "./supabase";

export class AuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "AuthError";
  }
}

export async function verifyAuth(request: Request) {
  const authHeader = request.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    throw new AuthError("認証が必要です");
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    throw new AuthError("認証が無効です");
  }

  return user;
}

export function handleAuthError(error: unknown) {
  if (error instanceof AuthError) {
    return Response.json(
      { error: { code: "UNAUTHORIZED", message: error.message } },
      { status: 401 }
    );
  }
  return Response.json(
    { error: { code: "INTERNAL_ERROR", message: "サーバーエラー" } },
    { status: 500 }
  );
}
