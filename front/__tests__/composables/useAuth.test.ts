import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { useNuxtApp } from "#imports";

// navigateTo は auto-import の解決先（#app/composables/router）を直接 import されるため、
// vi.mock("#imports") では届かない。mockNuxtImport で解決先ごと差し替える
// （__tests__/repositories/api-client.test.ts と同じ理由）。
const { navigateToMock } = vi.hoisted(() => ({ navigateToMock: vi.fn() }));

mockNuxtImport("navigateTo", () => navigateToMock);

const mockSignInWithPassword = vi.fn();
const mockSignInWithOAuth = vi.fn();
const mockSignOut = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();

  // 初期化済みの Supabase クライアントの auth メソッドをスタブで差し替える
  const nuxtApp = useNuxtApp();
  const supabase = (nuxtApp as Record<string, unknown>).$supabase as
    { client: { auth: Record<string, unknown> } } | undefined;
  if (supabase?.client?.auth) {
    supabase.client.auth.signInWithPassword = mockSignInWithPassword;
    supabase.client.auth.signInWithOAuth = mockSignInWithOAuth;
    supabase.client.auth.signOut = mockSignOut;
  }
});

describe("useAuth - login", () => {
  it("N-1: 認証に成功すると error: null を返す", async () => {
    mockSignInWithPassword.mockResolvedValue({ data: {}, error: null });

    const { login } = useAuth();
    const result = await login("owner@example.com", "password");

    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: "owner@example.com",
      password: "password",
    });
    expect(result).toEqual({ error: null });
  });

  it("S-1: 認証に失敗すると原因を区別しない固定メッセージを返す", async () => {
    mockSignInWithPassword.mockResolvedValue({
      data: {},
      error: { message: "Invalid login credentials" },
    });

    const { login } = useAuth();
    const result = await login("owner@example.com", "wrong");

    // Supabase のメッセージをそのまま出さない（アカウントの存在を推測させない）
    expect(result).toEqual({
      error: "メールアドレスまたはパスワードが正しくありません",
    });
  });
});

describe("useAuth - loginWithGoogle", () => {
  afterEach(() => {
    useRuntimeConfig().public.siteUrl = "";
  });

  it("N-1: signInWithOAuth を google プロバイダーで呼び出す", async () => {
    mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });

    const { loginWithGoogle } = useAuth();
    await loginWithGoogle();

    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "google" }),
    );
  });

  it("N-2: siteUrl が設定されていればそれをリダイレクト先にする", async () => {
    mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });
    useRuntimeConfig().public.siteUrl = "https://example.com";

    const { loginWithGoogle } = useAuth();
    await loginWithGoogle();

    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { redirectTo: "https://example.com/" },
      }),
    );
  });

  it("S-1: siteUrl が未設定ならブラウザのオリジンをリダイレクト先にする", async () => {
    mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });

    const { loginWithGoogle } = useAuth();
    await loginWithGoogle();

    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({
        options: { redirectTo: `${window.location.origin}/` },
      }),
    );
  });

  it("A-1: error が返った場合は Error を throw する", async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: null,
      error: { message: "OAuth error" },
    });

    const { loginWithGoogle } = useAuth();
    await expect(loginWithGoogle()).rejects.toThrow(
      "Googleログインに失敗しました",
    );
  });
});

describe("useAuth - logout", () => {
  it("N-1: サインアウトに成功すると /login へ遷移する", async () => {
    mockSignOut.mockResolvedValue({ error: null });

    const { logout } = useAuth();
    await logout();

    expect(mockSignOut).toHaveBeenCalled();
    expect(navigateToMock).toHaveBeenCalledWith("/login");
  });

  it("A-1: サインアウトに失敗すると Error を throw し、遷移しない", async () => {
    mockSignOut.mockResolvedValue({ error: { message: "network error" } });

    const { logout } = useAuth();

    await expect(logout()).rejects.toThrow("ログアウトに失敗しました");
    expect(navigateToMock).not.toHaveBeenCalled();
  });
});
