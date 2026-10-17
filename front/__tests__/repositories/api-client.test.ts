import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { useNuxtApp } from "#imports";

// navigateTo は Nuxt の auto-import で、変換後は "#imports" ではなく実体のモジュール
// （#app/composables/router）を直接 import する。そのため vi.mock("#imports") や
// vi.stubGlobal では対象コードの import binding に届かない。@nuxt/test-utils の
// mockNuxtImport は auto-import の解決先ごと差し替えるため、こちらを使う。

const { mockGetSession, mockRefreshSession, navigateToMock } = vi.hoisted(
  () => ({
    mockGetSession: vi.fn(),
    mockRefreshSession: vi.fn(),
    navigateToMock: vi.fn(),
  }),
);

mockNuxtImport("navigateTo", () => navigateToMock);

describe("useApiClient", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // 初期化済みの Supabase クライアントの auth メソッドをスタブで差し替える
    const nuxtApp = useNuxtApp();
    const supabase = (nuxtApp as Record<string, unknown>).$supabase as
      { client: { auth: Record<string, unknown> } } | undefined;
    if (supabase?.client?.auth) {
      supabase.client.auth.getSession = mockGetSession;
      supabase.client.auth.refreshSession = mockRefreshSession;
    }

    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "valid-token" } },
    });
  });

  // --- 正常系 ---

  it("N-1: 有効なトークンがある場合、Authorization ヘッダー付きで $fetch を呼ぶ", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ data: [] });
    vi.stubGlobal("$fetch", mockFetch);

    const { useApiClient } = await import("../../repositories/api-client");
    const { apiFetch } = useApiClient();
    await apiFetch("/api/spots");

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/spots");
    const authHeader = (options.headers as Headers).get("Authorization");
    expect(authHeader).toBe("Bearer valid-token");
  });

  it("N-2: セッションがない場合、Authorization ヘッダーなしで $fetch を呼ぶ", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const mockFetch = vi.fn().mockResolvedValue({ data: [] });
    vi.stubGlobal("$fetch", mockFetch);

    const { useApiClient } = await import("../../repositories/api-client");
    const { apiFetch } = useApiClient();
    await apiFetch("/api/spots");

    const [, options] = mockFetch.mock.calls[0];
    const authHeader = (options.headers as Headers).get("Authorization");
    expect(authHeader).toBeNull();
  });

  it("N-3: 追加の options（body, method）が $fetch に引き渡される", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ data: {} });
    vi.stubGlobal("$fetch", mockFetch);

    const { useApiClient } = await import("../../repositories/api-client");
    const { apiFetch } = useApiClient();
    await apiFetch("/api/spots", { method: "POST", body: { name: "test" } });

    const [, options] = mockFetch.mock.calls[0];
    expect(options.method).toBe("POST");
    expect(options.body).toEqual({ name: "test" });
  });

  // --- 準正常系 ---

  it("S-1: 401 エラー時にトークンをリフレッシュして1回リトライする", async () => {
    const error401 = Object.assign(new Error("401"), {
      response: { status: 401 },
    });
    const mockFetch = vi
      .fn()
      .mockRejectedValueOnce(error401)
      .mockResolvedValueOnce({ data: [] });
    vi.stubGlobal("$fetch", mockFetch);

    mockRefreshSession.mockResolvedValue({ error: null });
    mockGetSession
      .mockResolvedValueOnce({
        data: { session: { access_token: "old-token" } },
      })
      .mockResolvedValueOnce({
        data: { session: { access_token: "new-token" } },
      });

    const { useApiClient } = await import("../../repositories/api-client");
    const { apiFetch } = useApiClient();
    const result = await apiFetch("/api/spots");

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ data: [] });
    const [, retryOptions] = mockFetch.mock.calls[1];
    expect((retryOptions.headers as Headers).get("Authorization")).toBe(
      "Bearer new-token",
    );
  });

  it("S-2: 401 以外のエラーはリトライせずそのままスローする", async () => {
    const error500 = Object.assign(new Error("500"), {
      response: { status: 500 },
    });
    const mockFetch = vi.fn().mockRejectedValue(error500);
    vi.stubGlobal("$fetch", mockFetch);

    const { useApiClient } = await import("../../repositories/api-client");
    const { apiFetch } = useApiClient();
    await expect(apiFetch("/api/spots")).rejects.toThrow("500");

    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockRefreshSession).not.toHaveBeenCalled();
  });

  // --- 異常系 ---

  it("A-1: 401 でリフレッシュに失敗した場合、/login へ遷移して元のエラーを投げ、リトライしない", async () => {
    const error401 = Object.assign(new Error("401"), {
      response: { status: 401 },
    });
    const mockFetch = vi.fn().mockRejectedValue(error401);
    vi.stubGlobal("$fetch", mockFetch);

    mockRefreshSession.mockResolvedValue({
      error: new Error("refresh failed"),
    });

    const { useApiClient } = await import("../../repositories/api-client");
    const { apiFetch } = useApiClient();
    await expect(apiFetch("/api/spots")).rejects.toBe(error401);

    expect(navigateToMock).toHaveBeenCalledWith("/login");
    // リフレッシュが失敗した場合はリトライしない（fetch は1回のみ）
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("A-2: 401 でリフレッシュは成功したがトークンを再取得できない場合、/login へ遷移して元のエラーを投げる", async () => {
    const error401 = Object.assign(new Error("401"), {
      response: { status: 401 },
    });
    const mockFetch = vi.fn().mockRejectedValue(error401);
    vi.stubGlobal("$fetch", mockFetch);

    // refreshSession はエラーを返さないが、直後の getSession でセッションが消えている
    // （別タブでのログアウト・リフレッシュトークン失効の競合など）
    mockRefreshSession.mockResolvedValue({ error: null });
    mockGetSession
      .mockResolvedValueOnce({
        data: { session: { access_token: "old-token" } },
      })
      .mockResolvedValueOnce({ data: { session: null } });

    const { useApiClient } = await import("../../repositories/api-client");
    const { apiFetch } = useApiClient();
    await expect(apiFetch("/api/spots")).rejects.toBe(error401);

    expect(navigateToMock).toHaveBeenCalledWith("/login");
    // トークンが無いままリトライしない（fetch は1回のみ）
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
