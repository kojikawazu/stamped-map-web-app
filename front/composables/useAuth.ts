export const useAuth = () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const session = useSupabaseSession();

  // session が undefined の間はローディング中と判定する
  // @nuxtjs/supabase v1 では初期値 undefined → 認証確認後に null（未認証）or Session に変わる
  // null もチェックすると「ログアウト後」も loading 扱いになるため undefined のみ対象とする
  const isLoading = computed(() => session.value === undefined);

  // 成功時の navigateTo('/') は呼び出し側の pages/login.vue が行う
  const login = async (
    email: string,
    password: string
  ): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      return { error: "メールアドレスまたはパスワードが正しくありません" };
    }
    return { error: null };
  };

  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      // 呼び出し側（default.vue）の catch ブロックでトースト通知を行う
      throw new Error("ログアウトに失敗しました");
    }
    await navigateTo("/login");
  };

  return { user, session, isLoading, login, logout };
};
