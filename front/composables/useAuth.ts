export const useAuth = () => {
  const supabase = useSupabaseClient();
  const user = useSupabaseUser();
  const session = useSupabaseSession();

  // session が undefined の間はローディング中と判定する
  // ⚠️ useSupabaseSession() の初期値が undefined か null かは @nuxtjs/supabase のバージョンに依存する
  //    実装時に動作確認が必要。null から始まる場合は isLoading の代替手段を検討すること
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
      // トースト通知は呼び出し側で行う
      return;
    }
    await navigateTo("/login");
  };

  return { user, session, isLoading, login, logout };
};
