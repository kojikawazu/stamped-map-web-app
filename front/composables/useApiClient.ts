export const useApiClient = () => {
  const supabase = useSupabaseClient();

  const apiFetch = $fetch.create({
    async onRequest({ options }) {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.access_token) {
        options.headers = new Headers(options.headers as HeadersInit);
        (options.headers as Headers).set(
          "Authorization",
          `Bearer ${session.access_token}`
        );
      }
    },
    async onResponseError({ request, options, response }) {
      // _retried フラグで再試行を1回に制限し、無限ループを防ぐ
      // ⚠️ FetchOptions に _retried は存在しないため型アサーションが必要
      if (
        response.status === 401 &&
        !(options as Record<string, unknown>)._retried
      ) {
        (options as Record<string, unknown>)._retried = true;
        const { error } = await supabase.auth.refreshSession();
        if (error) {
          await navigateTo("/login");
          return;
        }
        // 新しいトークンでリクエストを再実行（現行の fetchWithRetry と同等）
        const {
          data: { session: newSession },
        } = await supabase.auth.getSession();
        if (newSession?.access_token) {
          const newHeaders = new Headers(options.headers as HeadersInit);
          newHeaders.set(
            "Authorization",
            `Bearer ${newSession.access_token}`
          );
          options.headers = newHeaders;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return $fetch(request as string, options as any);
        }
      }
    },
  });

  return { apiFetch };
};
