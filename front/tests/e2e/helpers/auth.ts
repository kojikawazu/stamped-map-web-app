import type { Page } from "@playwright/test";

/**
 * Supabase セッションを localStorage に直接注入してログイン状態をシミュレートする。
 * 実際の Supabase 認証フローを回避し、フロントエンドのみをテストする。
 */
export async function injectSupabaseSession(
  page: Page,
  options: { accessToken?: string; userId?: string } = {}
) {
  const accessToken = options.accessToken ?? "dummy-access-token";
  const userId = options.userId ?? "dummy-user-id";

  // Supabase が localStorage に保存するセッションキーを注入
  await page.addInitScript(
    ({ token, uid }) => {
      const session = {
        access_token: token,
        token_type: "bearer",
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        refresh_token: "dummy-refresh-token",
        user: {
          id: uid,
          email: "test@example.com",
          role: "authenticated",
        },
      };
      // @nuxtjs/supabase が使用するキー形式
      const key = `sb-${new URL("https://dummy.supabase.co").hostname.replace(/\./g, "-")}-auth-token`;
      localStorage.setItem(key, JSON.stringify(session));
    },
    { token: accessToken, uid: userId }
  );
}

/**
 * API レスポンスをモックするルートハンドラーを設定する。
 */
export async function mockApiRoutes(page: Page) {
  const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";
  const CAT_UUID = "660e8400-e29b-41d4-a716-446655440000";

  await page.route("**/api/categories", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        data: [
          {
            id: CAT_UUID,
            name: "カフェ",
            color: "#FF5733",
            isDefault: false,
            sortOrder: 1,
            spotCount: 2,
          },
        ],
      }),
    });
  });

  await page.route("**/api/spots**", (route) => {
    const url = route.request().url();
    if (url.includes("/markers")) {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: VALID_UUID,
              name: "東京タワー",
              latitude: 35.6586,
              longitude: 139.7454,
              categoryId: CAT_UUID,
              categoryColor: "#FF5733",
            },
          ],
        }),
      });
    } else {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: VALID_UUID,
              name: "東京タワー",
              category: { id: CAT_UUID, name: "カフェ", color: "#FF5733" },
              latitude: 35.6586,
              longitude: 139.7454,
              visitedAt: "2026-01-15",
              memo: "素晴らしい景色",
              imageUrl: null,
              createdAt: "2026-01-15T12:00:00.000Z",
              updatedAt: "2026-01-15T12:00:00.000Z",
            },
          ],
          pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
        }),
      });
    }
  });
}
