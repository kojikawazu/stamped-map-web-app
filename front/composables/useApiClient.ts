import type { FetchError } from "ofetch";

export const useApiClient = () => {
  const supabase = useSupabaseClient();

  const getAccessToken = async (): Promise<string | null> => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  };

  // onResponseError の戻り値は ofetch に無視されるため、
  // リトライは try/catch でラップした独自ラッパー関数として実装する
  const apiFetch = async <T = unknown>(
    url: string,
    options: Parameters<typeof $fetch>[1] = {}
  ): Promise<T> => {
    const token = await getAccessToken();
    const headers = new Headers(options.headers as HeadersInit);
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    try {
      return await ($fetch<T>(url, { ...options, headers }) as Promise<T>);
    } catch (err) {
      const fetchError = err as FetchError;
      if (fetchError.response?.status !== 401) {
        throw err;
      }
      // 401 のとき: トークンをリフレッシュして1回だけリトライ
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        await navigateTo("/login");
        throw err;
      }
      const newToken = await getAccessToken();
      if (!newToken) {
        await navigateTo("/login");
        throw err;
      }
      const retryHeaders = new Headers(options.headers as HeadersInit);
      retryHeaders.set("Authorization", `Bearer ${newToken}`);
      return await ($fetch<T>(url, { ...options, headers: retryHeaders }) as Promise<T>);
    }
  };

  return { apiFetch };
};
