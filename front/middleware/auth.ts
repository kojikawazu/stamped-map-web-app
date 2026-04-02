export default defineNuxtRouteMiddleware(() => {
  // SSR ではスキップしクライアントサイドで再評価する
  // useSupabaseUser() は SSR 時点では null になるため、ガードしないとリダイレクトループが発生する
  if (import.meta.server) return;

  const user = useSupabaseUser();
  if (!user.value) {
    return navigateTo("/login");
  }
});
