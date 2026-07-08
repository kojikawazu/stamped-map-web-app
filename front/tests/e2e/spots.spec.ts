import { expect, test } from "@playwright/test";
import { injectSupabaseSession } from "./helpers/auth";

/**
 * スポットのシナリオ E2E テスト（実 DB）。
 *
 * - API はモックせず、実 PostGIS + Server API を通す（`E2E_AUTH_BYPASS=1` で
 *   サーバーの Supabase 認証をスキップし owner として扱う）。
 * - クライアントは `injectSupabaseSession` で「ログイン済み」状態にし、
 *   auth ミドルウェアの /login リダイレクトを回避する。
 * - アサーションは web-first（自動待機）で行い、`waitForTimeout` は使わない（flaky 対策）。
 *
 * シードデータ（prisma/seed.ts）:
 *   カテゴリ: 食事 / 自然 / 観光 / ショッピング / その他
 *   スポット: 渋谷スクランブル交差点(観光) / 新宿御苑(自然) / 築地場外市場(食事) /
 *            浅草寺(観光, memo「雷門を初めて見た」) / 吉祥寺 ハモニカ横丁(食事)
 */

test.describe("Spots scenarios (real DB)", () => {
  test.beforeEach(async ({ page }) => {
    await injectSupabaseSession(page);
    await page.goto("/");
  });

  test("N-1: シードされたスポット一覧が実 DB から表示される", async ({
    page,
  }) => {
    await expect(page.getByText("スポット一覧")).toBeVisible();
    await expect(page.getByText("渋谷スクランブル交差点")).toBeVisible();
    await expect(page.getByText("浅草寺")).toBeVisible();
  });

  test("N-2: カテゴリバッジが一覧に表示される", async ({ page }) => {
    // 観光カテゴリのスポットが2件あるため、バッジ「観光」が表示される
    await expect(page.getByText("観光").first()).toBeVisible();
  });

  test("N-3: 名前検索（q）が実 API+DB で絞り込む", async ({ page }) => {
    await expect(page.getByText("浅草寺")).toBeVisible();

    await page.getByPlaceholder("スポット名を検索...").fill("浅草");

    // デバウンス後に実 API が走り、一致するもののみ残る（自動待機で収束を待つ）
    await expect(page.getByText("浅草寺")).toBeVisible();
    await expect(page.getByText("渋谷スクランブル交差点")).toHaveCount(0);
  });

  test("N-4: スポットをクリックすると詳細ドロワーにメモが表示される", async ({
    page,
  }) => {
    await page.getByText("浅草寺").click();

    // 詳細ドロワーにシードの memo が表示される
    await expect(page.getByText("雷門を初めて見た")).toBeVisible();
  });

  test("N-5: スポットを新規登録すると一覧と実 DB に反映される", async ({
    page,
  }) => {
    // owner 判定（is-owner）が true のため登録ボタンが出る
    const openCreate = page.getByRole("button", { name: "登録" }).first();
    await expect(openCreate).toBeVisible();
    await openCreate.click();

    const modal = page.locator(".modal-enter");
    await expect(modal.getByText("スポット登録")).toBeVisible();

    const uniqueName = `E2E登録テスト_${Date.now()}`;
    await page.getByPlaceholder("例：渋谷スクランブル交差点").fill(uniqueName);
    await modal.locator("select").selectOption({ label: "観光" });
    await modal.locator('input[type="date"]').fill("2025-06-01");
    await page.getByPlaceholder("例：35.6812").fill("35.68");
    await page.getByPlaceholder("例：139.7671").fill("139.76");

    await modal.getByRole("button", { name: "登録" }).click();

    // モーダルが閉じ、一覧が再取得されて新スポットが表示される
    await expect(page.getByText(uniqueName)).toBeVisible();
  });

  test("S-1: 名前が空だと登録できずエラーが表示される", async ({ page }) => {
    await page.getByRole("button", { name: "登録" }).first().click();

    const modal = page.locator(".modal-enter");
    await expect(modal.getByText("スポット登録")).toBeVisible();

    // 名前以外（カテゴリ・訪問日・座標）を埋めて送信 → 名前必須エラーで弾かれ、
    // モーダルは閉じない（座標を埋めるのは、空だと座標エラーで先に return するため）。
    await modal.locator("select").selectOption({ label: "観光" });
    await modal.locator('input[type="date"]').fill("2025-06-01");
    await page.getByPlaceholder("例：35.6812").fill("35.68");
    await page.getByPlaceholder("例：139.7671").fill("139.76");

    await modal.getByRole("button", { name: "登録" }).click();

    await expect(page.getByText("スポット名は必須です")).toBeVisible();
    await expect(modal.getByText("スポット登録")).toBeVisible();
  });

  test("S-2: 一致しない検索は空状態を表示する", async ({ page }) => {
    await expect(page.getByText("渋谷スクランブル交差点")).toBeVisible();

    await page
      .getByPlaceholder("スポット名を検索...")
      .fill("該当しないスポットXYZ");

    await expect(
      page.getByText("スポットが見つかりませんでした"),
    ).toBeVisible();
  });
});

test.describe("Spots scenarios (未認証)", () => {
  test("A-1: 未認証でメインページにアクセスすると /login にリダイレクトされる", async ({
    page,
  }) => {
    // セッション注入なし
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });
});
