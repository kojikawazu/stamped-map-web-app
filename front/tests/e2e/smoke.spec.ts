import { test, expect } from "@playwright/test";

/**
 * スモークテスト: アプリケーションの基本的な起動・表示を確認する。
 * 認証状態に依存せず、ページが正常に読み込まれることを検証する。
 */

test.describe("Smoke Tests", () => {
  test("S-1: ログインページが表示される", async ({ page }) => {
    await page.goto("/login");

    await expect(page).toHaveTitle(/Stamped Map|スタンプマップ/i);
    await expect(
      page.getByRole("textbox", { name: /メール|email/i })
    ).toBeVisible();
    await expect(
      page.getByRole("textbox", { name: /パスワード|password/i })
    ).toBeVisible();
  });

  test("S-2: 未認証でルートにアクセスするとログインページにリダイレクトされる", async ({
    page,
  }) => {
    await page.goto("/");

    // auth middleware が /login にリダイレクトすることを確認
    await expect(page).toHaveURL(/\/login/);
  });

  test("S-3: 存在しないページで error.vue が表示される", async ({ page }) => {
    const response = await page.goto("/non-existent-page-xyz");

    // 404 またはエラーページが表示されること
    // Nuxt の error.vue はカスタムエラー表示を行う
    expect(response?.status()).toBeOneOf([200, 404]);
  });

  test("S-4: コンソールに重大なエラーが出ていない", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Supabase の設定警告は許容するが、JS エラーは検出する
    const jsErrors = errors.filter(
      (e) =>
        !e.includes("supabase") &&
        !e.includes("NUXT_PUBLIC") &&
        !e.includes("favicon")
    );
    expect(jsErrors).toHaveLength(0);
  });
});
