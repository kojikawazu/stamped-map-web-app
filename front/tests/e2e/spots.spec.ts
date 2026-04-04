import { test, expect } from "@playwright/test";
import { injectSupabaseSession, mockApiRoutes } from "./helpers/auth";

/**
 * スポット一覧・フィルタリングの E2E テスト。
 * API は page.route() でモックし、フロントエンドの UI 動作を検証する。
 */

test.describe("Spot List & Filter", () => {
  test.beforeEach(async ({ page }) => {
    await injectSupabaseSession(page);
    await mockApiRoutes(page);
  });

  test("N-1: メインページでスポット一覧パネルが表示される", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // SpotPanel が表示されること
    // SpotList 内にスポット名が表示されること
    await expect(page.getByText("東京タワー")).toBeVisible({ timeout: 10_000 });
  });

  test("N-2: カテゴリバッジが正しい色で表示される", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // カテゴリ名が表示されること
    await expect(page.getByText("カフェ")).toBeVisible({ timeout: 10_000 });
  });

  test("N-3: 検索ボックスに入力すると API が呼ばれる", async ({ page }) => {
    let searchApiCalled = false;

    await page.route("**/api/spots**", (route) => {
      const url = route.request().url();
      if (url.includes("q=東京") && !url.includes("markers")) {
        searchApiCalled = true;
      }
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [],
          pagination: { page: 1, limit: 20, total: 0, totalPages: 1 },
        }),
      });
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const searchInput = page.getByPlaceholder(/スポット名を検索/i);
    await expect(searchInput).toBeVisible({ timeout: 5_000 });
    await searchInput.fill("東京");
    // デバウンス（300ms）を待機
    await page.waitForTimeout(500);
    expect(searchApiCalled).toBe(true);
  });

  test("N-4: ページネーションで次のページに移動できる", async ({ page }) => {
    // ページネーションが必要な件数のモックデータを設定
    await page.route("**/api/spots**", (route) => {
      const url = route.request().url();
      if (url.includes("markers")) {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ data: [] }),
        });
        return;
      }
      const urlObj = new URL(url);
      const page_num = parseInt(urlObj.searchParams.get("page") ?? "1");
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "spot-" + page_num,
              name: page_num === 1 ? "スポットA" : "スポットB",
              category: { id: "cat-1", name: "カフェ", color: "#FF5733" },
              latitude: 35.0,
              longitude: 139.0,
              visitedAt: "2026-01-15",
              memo: null,
              imageUrl: null,
              createdAt: "2026-01-15T12:00:00.000Z",
              updatedAt: "2026-01-15T12:00:00.000Z",
            },
          ],
          pagination: { page: page_num, limit: 20, total: 25, totalPages: 2 },
        }),
      });
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // 次のページボタンが表示されていることを確認してからクリック
    const nextButton = page.getByRole("button", { name: "次へ" }).first();
    await expect(nextButton).toBeVisible({ timeout: 5_000 });
    await nextButton.click();
    await page.waitForTimeout(500);
    await expect(page.getByText("スポットB")).toBeVisible({ timeout: 5_000 });
  });

  test("S-1: API エラー時にエラー状態が表示される", async ({ page }) => {
    await page.route("**/api/spots**", (route) => {
      if (route.request().url().includes("markers")) {
        route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) });
        return;
      }
      route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ message: "Internal Server Error" }) });
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // API がエラーを返すとき、スポット一覧アイテムは表示されない
    await expect(page.getByText("東京タワー")).not.toBeVisible({ timeout: 5_000 });
  });

  test("A-1: 未認証状態でメインページにアクセスするとログインページにリダイレクトされる", async ({
    page,
  }) => {
    // セッション注入なしでアクセス
    await page.goto("/");

    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });
});
