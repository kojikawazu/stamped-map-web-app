import { describe, expect, it } from "vitest";
import { db, makeEvent, readBodyMock } from "./harness";

// 実 DB にカテゴリを1件作成する。
async function seedCategory(over: Record<string, unknown> = {}) {
  return db().mapCategory.create({
    data: {
      name: "カフェ",
      color: "#FF0000",
      isDefault: false,
      sortOrder: 1,
      ...over,
    },
  });
}

// 実 DB にスポットを1件作成する。
async function seedSpot(
  categoryId: string,
  over: Record<string, unknown> = {},
) {
  return db().mapSpot.create({
    data: {
      name: "スポット",
      categoryId,
      latitude: 35.0,
      longitude: 139.0,
      visitedAt: new Date("2025-01-01"),
      ...over,
    },
  });
}

// --- GET /api/categories ---

describe("[IT] GET /api/categories", () => {
  it("N-1: 実 DB の _count から spotCount を集計して返す", async () => {
    const cat = await seedCategory({ name: "カフェ" });
    await seedSpot(cat.id, { name: "A" });
    await seedSpot(cat.id, { name: "B" });

    const handler = (await import("../../server/api/categories/index.get"))
      .default;
    const res = await handler(makeEvent("GET", "/api/categories"));

    expect(res.data).toHaveLength(1);
    expect(res.data[0]).toMatchObject({ name: "カフェ", spotCount: 2 });
  });

  it("N-2: sortOrder 昇順で並ぶ（実クエリの orderBy）", async () => {
    await seedCategory({ name: "B", sortOrder: 2 });
    await seedCategory({ name: "A", sortOrder: 1 });

    const handler = (await import("../../server/api/categories/index.get"))
      .default;
    const res = await handler(makeEvent("GET", "/api/categories"));

    expect(res.data.map((c: { name: string }) => c.name)).toEqual(["A", "B"]);
  });

  it("N-3: 0 件のとき空配列を返す", async () => {
    const handler = (await import("../../server/api/categories/index.get"))
      .default;
    const res = await handler(makeEvent("GET", "/api/categories"));
    expect(res.data).toEqual([]);
  });
});

// --- POST /api/categories ---

describe("[IT] POST /api/categories", () => {
  it("N-1: カテゴリを実 DB に永続化し sortOrder を採番する", async () => {
    await seedCategory({ name: "既存", sortOrder: 3 });
    readBodyMock.mockResolvedValue({ name: "公園", color: "#00AA00" });

    const handler = (await import("../../server/api/categories/index.post"))
      .default;
    const res = await handler(makeEvent("POST", "/api/categories"));

    expect(res.data).toMatchObject({ name: "公園", color: "#00AA00" });

    const row = await db().mapCategory.findUnique({ where: { name: "公園" } });
    expect(row).not.toBeNull();
    // 既存 max(sortOrder)=3 の次 → 4
    expect(row?.sortOrder).toBe(4);
  });

  it("S-1: 同名カテゴリが実在するとき 400 DUPLICATE_CATEGORY（作成しない）", async () => {
    await seedCategory({ name: "カフェ" });
    readBodyMock.mockResolvedValue({ name: "カフェ", color: "#00AA00" });

    const handler = (await import("../../server/api/categories/index.post"))
      .default;

    await expect(
      handler(makeEvent("POST", "/api/categories")),
    ).rejects.toMatchObject({
      statusCode: 400,
      data: { code: "DUPLICATE_CATEGORY" },
    });
    expect(await db().mapCategory.count()).toBe(1);
  });
});

// --- DELETE /api/categories/:id ---

describe("[IT] DELETE /api/categories/:id", () => {
  it("N-1: 未使用の非デフォルトカテゴリを実 DB から削除する", async () => {
    const cat = await seedCategory({ name: "削除対象" });

    const handler = (
      await import("../../server/api/categories/[id]/index.delete")
    ).default;
    await handler(
      makeEvent("DELETE", `/api/categories/${cat.id}`, { id: cat.id }),
    );

    expect(
      await db().mapCategory.findUnique({ where: { id: cat.id } }),
    ).toBeNull();
  });

  it("S-1: デフォルトカテゴリは 400 DEFAULT_CATEGORY_DELETE（削除しない）", async () => {
    const cat = await seedCategory({ name: "デフォルト", isDefault: true });

    const handler = (
      await import("../../server/api/categories/[id]/index.delete")
    ).default;
    await expect(
      handler(makeEvent("DELETE", `/api/categories/${cat.id}`, { id: cat.id })),
    ).rejects.toMatchObject({
      statusCode: 400,
      data: { code: "DEFAULT_CATEGORY_DELETE" },
    });
    expect(
      await db().mapCategory.findUnique({ where: { id: cat.id } }),
    ).not.toBeNull();
  });

  it("S-2: スポットが紐づくカテゴリは 400 CATEGORY_IN_USE（削除しない）", async () => {
    const cat = await seedCategory({ name: "使用中" });
    await seedSpot(cat.id);

    const handler = (
      await import("../../server/api/categories/[id]/index.delete")
    ).default;
    await expect(
      handler(makeEvent("DELETE", `/api/categories/${cat.id}`, { id: cat.id })),
    ).rejects.toMatchObject({
      statusCode: 400,
      data: { code: "CATEGORY_IN_USE" },
    });
    expect(
      await db().mapCategory.findUnique({ where: { id: cat.id } }),
    ).not.toBeNull();
  });

  it("S-3: 存在しない ID は 404", async () => {
    const handler = (
      await import("../../server/api/categories/[id]/index.delete")
    ).default;
    const missing = "550e8400-e29b-41d4-a716-446655440000";
    await expect(
      handler(
        makeEvent("DELETE", `/api/categories/${missing}`, { id: missing }),
      ),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});
