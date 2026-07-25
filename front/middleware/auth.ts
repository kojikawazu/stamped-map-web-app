/**
 * 未認証ユーザーを `/login` へリダイレクトするルートミドルウェア。
 *
 * SSR 時点では `useSupabaseUser()` が必ず null になるため判定をスキップし、
 * クライアントサイドで再評価する（スキップしないとリダイレクトループになる）。
 */
export default defineNuxtRouteMiddleware(() => {
  // SSR ではスキップしクライアントサイドで再評価する
  // useSupabaseUser() は SSR 時点では null になるため、ガードしないとリダイレクトループが発生する
  if (import.meta.server) return;

  const user = useSupabaseUser();
  if (!user.value) {
    return navigateTo("/login");
  }
});
