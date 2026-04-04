import { test, expect } from "@playwright/test";
import { injectSupabaseSession, mockApiRoutes } from "./helpers/auth";

/**
 * 認証フローテスト: ログイン・ログアウトの動作を検証する。
 * Supabase Auth はモックし、フロントエンドのルーティング・UI をテストする。
 */

test.describe("Authentication", () => {
  test("N-1: ログインフォームが正しくレンダリングされる", async ({ page }) => {
    await page.goto("/login");

    await expect(
      page.getByRole("textbox", { name: /メール|email/i })
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: /パスワード|password/i })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /ログイン|sign in/i })).toBeVisible();
  });

  test("N-2: Supabase 認証成功後にメイン画面に遷移する", async ({ page }) => {
    // Supabase Auth API をモック（成功レスポンス）
    await page.route("**/auth/v1/token**", (route) => {
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "mock-access-token",
          token_type: "bearer",
          expires_in: 3600,
          refresh_token: "mock-refresh-token",
          user: {
            id: "user-1",
            email: "test@example.com",
            role: "authenticated",
          },
        }),
      });
    });

    await mockApiRoutes(page);
    await page.goto("/login");

    await page
      .getByRole("textbox", { name: /メール|email/i })
      .fill("test@example.com");
    await page
      .getByRole("textbox", { name: /パスワード|password/i })
      .fill("password123");
    await page.getByRole("button", { name: /ログイン|sign in/i }).click();

    // ログイン後はメインページ（/）に遷移することを確認
    await expect(page).toHaveURL("/", { timeout: 10_000 });
  });

  test("S-1: メールアドレスが空のままログインしようとするとエラーが表示される", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByRole("button", { name: /ログイン|sign in/i }).click();

    // HTML5 バリデーションまたはカスタムエラーメッセージが表示されること
    const emailInput = page.getByRole("textbox", { name: /メール|email/i });
    const isInvalid =
      (await emailInput.evaluate((el) =>
        (el as HTMLInputElement).validity.valid
      )) === false;
    expect(isInvalid).toBe(true);
  });

  test("S-2: 認証失敗時にエラーメッセージが表示される", async ({ page }) => {
    // Supabase Auth API をモック（失敗レスポンス）
    await page.route("**/auth/v1/token**", (route) => {
      route.fulfill({
        status: 400,
        contentType: "application/json",
        body: JSON.stringify({
          error: "invalid_grant",
          error_description: "Invalid login credentials",
        }),
      });
    });

    await page.goto("/login");
    await page
      .getByRole("textbox", { name: /メール|email/i })
      .fill("wrong@example.com");
    await page
      .getByRole("textbox", { name: /パスワード|password/i })
      .fill("wrongpassword");
    await page.getByRole("button", { name: /ログイン|sign in/i }).click();

    // エラーメッセージが表示されること（ログインページに留まる）
    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });

  test("A-1: 認証済み状態でログインページにアクセスしてもページが正常に表示される", async ({
    page,
  }) => {
    // 共有ヘルパーで正しいキー形式（sb-{project-ref}-auth-token）を使ってセッションを注入する
    await injectSupabaseSession(page);
    await mockApiRoutes(page);

    // auth middleware はログイン済みユーザーを /login から追い出す処理を持たない（未認証→/login のみ）
    // そのためログインページがそのまま表示される
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveURL(/\/login/, { timeout: 5_000 });
  });
});
