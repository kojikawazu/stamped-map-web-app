import { describe, it, expect, vi, beforeEach } from "vitest";
import { useNuxtApp } from "#imports";

const navigateToMock = vi.fn();

vi.mock("#imports", async (importOriginal) => {
  const actual = await importOriginal<Record<string, unknown>>();
  return {
    ...actual,
    navigateTo: navigateToMock,
  };
});

describe("useAuth - loginWithGoogle", () => {
  const mockSignInWithOAuth = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    const nuxtApp = useNuxtApp();
    const supabase = (nuxtApp as Record<string, unknown>).$supabase as
      | { client: { auth: Record<string, unknown> } }
      | undefined;
    if (supabase?.client?.auth) {
      supabase.client.auth.signInWithOAuth = mockSignInWithOAuth;
    }
  });

  it("正常系: signInWithOAuth を google プロバイダーで呼び出す", async () => {
    mockSignInWithOAuth.mockResolvedValue({ data: {}, error: null });

    const { loginWithGoogle } = useAuth();
    await loginWithGoogle();

    expect(mockSignInWithOAuth).toHaveBeenCalledWith(
      expect.objectContaining({ provider: "google" })
    );
  });

  it("異常系: error が返った場合は Error を throw する", async () => {
    mockSignInWithOAuth.mockResolvedValue({
      data: null,
      error: { message: "OAuth error" },
    });

    const { loginWithGoogle } = useAuth();
    await expect(loginWithGoogle()).rejects.toThrow("Googleログインに失敗しました");
  });
});
