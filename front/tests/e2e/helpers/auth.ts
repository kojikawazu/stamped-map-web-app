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

  const session = {
    access_token: accessToken,
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    refresh_token: "dummy-refresh-token",
    user: {
      id: userId,
      email: "test@example.com",
      role: "authenticated",
    },
  };
  const cookieName = "sb-dummy-supabase-co-auth-token";
  // playwright.config.ts の baseURL のホスト名を取得
  const url = new URL(process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000");

  // SSR 用: @nuxtjs/supabase がサーバー側で読む cookie にセッションを注入
  await page.context().addCookies([
    {
      name: cookieName,
      value: JSON.stringify(session),
      domain: url.hostname,
      path: "/",
    },
  ]);

  // クライアント用: localStorage にもセッションを注入
  await page.addInitScript(
    ({ sess, key }) => {
      localStorage.setItem(key, JSON.stringify(sess));
    },
    { sess: session, key: cookieName }
  );

  // Supabase Auth API のモック: getUser / getSession を成功レスポンスにする
  await page.route("**/auth/v1/user", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(session.user),
    });
  });
  await page.route("**/auth/v1/token?grant_type=refresh_token", (route) => {
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(session),
    });
  });
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
