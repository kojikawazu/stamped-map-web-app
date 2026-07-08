import { describe, expect, it } from "vitest";
import { db, makeEvent, readBodyMock } from "./harness";

// スポットは FK でカテゴリを要求するため、まずカテゴリを実 DB に作る。
async function seedCategory(over: Record<string, unknown> = {}) {
  return db().mapCategory.create({
    data: { name: "カフェ", color: "#33AA55", sortOrder: 1, ...over },
  });
}

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

// --- POST /api/spots ---

describe("[IT] POST /api/spots", () => {
  it("N-1: 実 DB に永続化し FK でカテゴリに紐づく", async () => {
    const cat = await seedCategory();
    readBodyMock.mockResolvedValue({
      name: "東京タワー",
      categoryId: cat.id,
      latitude: 35.6586,
      longitude: 139.7454,
      visitedAt: "2025-02-03",
      memo: "夜景",
    });

    const handler = (await import("../../server/api/spots/index.post")).default;
    const res = await handler(makeEvent("POST", "/api/spots"));

    expect(res.data.name).toBe("東京タワー");
    const row = await db().mapSpot.findUnique({ where: { id: res.data.id } });
    expect(row?.categoryId).toBe(cat.id);
    // @db.Date が日付として保存される
    expect(row?.visitedAt.toISOString()).toContain("2025-02-03");
  });

  it("S-1: 存在しないカテゴリ ID は 400（作成しない）", async () => {
    readBodyMock.mockResolvedValue({
      name: "X",
      categoryId: "550e8400-e29b-41d4-a716-446655440000",
      latitude: 35,
      longitude: 139,
      visitedAt: "2025-02-03",
    });

    const handler = (await import("../../server/api/spots/index.post")).default;
    await expect(
      handler(makeEvent("POST", "/api/spots")),
    ).rejects.toMatchObject({ statusCode: 400 });
    expect(await db().mapSpot.count()).toBe(0);
  });
});

// --- GET /api/spots（実クエリ: ページング・ソート・フィルタ・検索） ---

describe("[IT] GET /api/spots", () => {
  it("N-1: ページネーションが実クエリ（skip/take/count）で機能する", async () => {
    const cat = await seedCategory();
    for (let i = 0; i < 25; i++) {
      await seedSpot(cat.id, {
        name: `S${i}`,
        visitedAt: new Date(2025, 0, i + 1),
      });
    }

    const handler = (await import("../../server/api/spots/index.get")).default;
    const res = await handler(makeEvent("GET", "/api/spots?page=2&limit=10"));

    expect(res.pagination).toMatchObject({
      page: 2,
      limit: 10,
      total: 25,
      totalPages: 3,
    });
    expect(res.data).toHaveLength(10);
  });

  it("N-2: visited_at 降順ソートが実クエリで反映される", async () => {
    const cat = await seedCategory();
    await seedSpot(cat.id, { name: "古", visitedAt: new Date("2025-01-01") });
    await seedSpot(cat.id, { name: "新", visitedAt: new Date("2025-12-31") });

    const handler = (await import("../../server/api/spots/index.get")).default;
    const res = await handler(
      makeEvent("GET", "/api/spots?sort=visited_at&order=desc"),
    );

    expect(res.data.map((s: { name: string }) => s.name)).toEqual(["新", "古"]);
  });

  it("N-3: カテゴリフィルタが実クエリで絞り込む", async () => {
    const a = await seedCategory({ name: "A" });
    const b = await seedCategory({ name: "B" });
    await seedSpot(a.id, { name: "a1" });
    await seedSpot(b.id, { name: "b1" });

    const handler = (await import("../../server/api/spots/index.get")).default;
    const res = await handler(makeEvent("GET", `/api/spots?category=${a.id}`));

    expect(res.data).toHaveLength(1);
    expect(res.data[0].name).toBe("a1");
  });

  it("N-4: 名前の部分一致検索（q）が実クエリで機能する", async () => {
    const cat = await seedCategory();
    await seedSpot(cat.id, { name: "東京タワー" });
    await seedSpot(cat.id, { name: "大阪城" });

    const handler = (await import("../../server/api/spots/index.get")).default;
    const res = await handler(makeEvent("GET", "/api/spots?q=東京"));

    expect(res.data).toHaveLength(1);
    expect(res.data[0].name).toBe("東京タワー");
  });
});

// --- GET /api/spots/markers ---

describe("[IT] GET /api/spots/markers", () => {
  it("N-1: 軽量マーカーデータを実 DB から返す", async () => {
    const cat = await seedCategory({ color: "#123456" });
    await seedSpot(cat.id, { name: "M1" });

    const handler = (await import("../../server/api/spots/markers.get"))
      .default;
    const res = await handler(makeEvent("GET", "/api/spots/markers"));

    expect(res.data).toHaveLength(1);
    expect(res.data[0]).toMatchObject({ name: "M1", categoryColor: "#123456" });
    expect(res.data[0]).not.toHaveProperty("category");
  });
});

// --- PUT / DELETE /api/spots/:id ---

describe("[IT] PUT /api/spots/:id", () => {
  it("N-1: 実 DB のスポットを更新する", async () => {
    const cat = await seedCategory();
    const spot = await seedSpot(cat.id, { name: "旧名" });
    readBodyMock.mockResolvedValue({
      name: "新名",
      categoryId: cat.id,
      latitude: 40,
      longitude: 141,
      visitedAt: "2025-03-03",
    });

    const handler = (await import("../../server/api/spots/[id]/index.put"))
      .default;
    await handler(makeEvent("PUT", `/api/spots/${spot.id}`, { id: spot.id }));

    const row = await db().mapSpot.findUnique({ where: { id: spot.id } });
    expect(row?.name).toBe("新名");
    expect(row?.latitude).toBe(40);
  });

  it("S-1: 存在しない ID は 404", async () => {
    const missing = "550e8400-e29b-41d4-a716-446655440000";
    readBodyMock.mockResolvedValue({
      name: "x",
      categoryId: missing,
      latitude: 1,
      longitude: 1,
      visitedAt: "2025-01-01",
    });
    const handler = (await import("../../server/api/spots/[id]/index.put"))
      .default;
    await expect(
      handler(makeEvent("PUT", `/api/spots/${missing}`, { id: missing })),
    ).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe("[IT] DELETE /api/spots/:id", () => {
  it("N-1: 実 DB のスポットを削除する", async () => {
    const cat = await seedCategory();
    const spot = await seedSpot(cat.id);

    const handler = (await import("../../server/api/spots/[id]/index.delete"))
      .default;
    await handler(
      makeEvent("DELETE", `/api/spots/${spot.id}`, { id: spot.id }),
    );

    expect(
      await db().mapSpot.findUnique({ where: { id: spot.id } }),
    ).toBeNull();
  });
});
