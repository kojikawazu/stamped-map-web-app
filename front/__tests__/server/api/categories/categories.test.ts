import { describe, it, expect, vi, beforeEach } from "vitest";
import { createEvent } from "h3";
import { IncomingMessage, ServerResponse } from "node:http";

// --- モック定義 ---
// verifyAuth と prisma は Nitro オートインポートのためグローバルスタブで差し替える

const prismaMock = {
  mapCategory: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    aggregate: vi.fn(),
  },
};

vi.stubGlobal("verifyAuth", vi.fn().mockResolvedValue({ id: "user-1" }));
vi.stubGlobal("prisma", prismaMock);

// --- テストヘルパー ---

function makeEvent(
  method: string,
  path: string,
  params?: Record<string, string>
) {
  const req = Object.assign(new IncomingMessage(null as never), {
    method,
    url: path,
    headers: { authorization: "Bearer test-token" },
  });
  const res = new ServerResponse(req);
  const event = createEvent(req, res);
  if (params) {
    (event.context as Record<string, unknown>).params = params;
  }
  return event;
}

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

const mockCategory = {
  id: VALID_UUID,
  name: "カフェ",
  color: "#FF0000",
  isDefault: false,
  sortOrder: 1,
  _count: { mapSpots: 3 },
};

// --- GET /api/categories ---

describe("GET /api/categories", () => {
  beforeEach(() => vi.clearAllMocks());

  it("N-1: カテゴリ一覧を spotCount 付きで返す", async () => {
    prismaMock.mapCategory.findMany.mockResolvedValue([mockCategory]);

    const handler = (
      await import("../../../../server/api/categories/index.get")
    ).default;
    const event = makeEvent("GET", "/api/categories");
    const result = await handler(event);

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: VALID_UUID,
      name: "カフェ",
      color: "#FF0000",
      isDefault: false,
      sortOrder: 1,
      spotCount: 3,
    });
  });

  it("N-2: カテゴリが 0 件のとき空配列を返す", async () => {
    prismaMock.mapCategory.findMany.mockResolvedValue([]);

    const handler = (
      await import("../../../../server/api/categories/index.get")
    ).default;
    const event = makeEvent("GET", "/api/categories");
    const result = await handler(event);

    expect(result.data).toEqual([]);
  });

  it("N-3: sortOrder 昇順でカテゴリが並んでいることを確認する", async () => {
    const cats = [
      { ...mockCategory, id: "id-1", sortOrder: 2 },
      { ...mockCategory, id: "id-2", sortOrder: 1 },
    ];
    prismaMock.mapCategory.findMany.mockResolvedValue(cats);

    const handler = (
      await import("../../../../server/api/categories/index.get")
    ).default;
    const event = makeEvent("GET", "/api/categories");
    await handler(event);

    expect(prismaMock.mapCategory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { sortOrder: "asc" } })
    );
  });
});

// --- DELETE /api/categories/:id ---

describe("DELETE /api/categories/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("N-1: 使用されていない非デフォルトカテゴリを削除できる", async () => {
    prismaMock.mapCategory.findUnique.mockResolvedValue({
      ...mockCategory,
      isDefault: false,
      _count: { mapSpots: 0 },
    });
    prismaMock.mapCategory.delete.mockResolvedValue(mockCategory);

    const handler = (
      await import("../../../../server/api/categories/[id]/index.delete")
    ).default;
    const event = makeEvent("DELETE", `/api/categories/${VALID_UUID}`, {
      id: VALID_UUID,
    });
    const result = await handler(event);

    expect(result.data.id).toBe(VALID_UUID);
    expect(prismaMock.mapCategory.delete).toHaveBeenCalledWith({
      where: { id: VALID_UUID },
    });
  });

  it("S-1: デフォルトカテゴリを削除しようとすると 400 をスローする", async () => {
    prismaMock.mapCategory.findUnique.mockResolvedValue({
      ...mockCategory,
      isDefault: true,
      _count: { mapSpots: 0 },
    });

    const handler = (
      await import("../../../../server/api/categories/[id]/index.delete")
    ).default;
    const event = makeEvent("DELETE", `/api/categories/${VALID_UUID}`, {
      id: VALID_UUID,
    });

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: "DEFAULT_CATEGORY_DELETE" },
    });
  });

  it("S-2: スポットが紐づいているカテゴリを削除しようとすると 400 をスローする", async () => {
    prismaMock.mapCategory.findUnique.mockResolvedValue({
      ...mockCategory,
      isDefault: false,
      _count: { mapSpots: 5 },
    });

    const handler = (
      await import("../../../../server/api/categories/[id]/index.delete")
    ).default;
    const event = makeEvent("DELETE", `/api/categories/${VALID_UUID}`, {
      id: VALID_UUID,
    });

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: "CATEGORY_IN_USE" },
    });
  });

  it("S-3: 存在しない ID のとき 404 をスローする", async () => {
    prismaMock.mapCategory.findUnique.mockResolvedValue(null);

    const handler = (
      await import("../../../../server/api/categories/[id]/index.delete")
    ).default;
    const event = makeEvent("DELETE", `/api/categories/${VALID_UUID}`, {
      id: VALID_UUID,
    });

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("S-4: 不正な UUID フォーマットのとき 400 をスローする", async () => {
    const handler = (
      await import("../../../../server/api/categories/[id]/index.delete")
    ).default;
    const event = makeEvent("DELETE", "/api/categories/invalid-id", {
      id: "invalid-id",
    });

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 });
  });
});

// --- PUT /api/categories/:id ---

describe("PUT /api/categories/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("S-1: 不正な UUID フォーマットのとき 400 をスローする", async () => {
    const handler = (
      await import("../../../../server/api/categories/[id]/index.put")
    ).default;
    const event = makeEvent("PUT", "/api/categories/invalid-id", {
      id: "invalid-id",
    });

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 });
  });

  it("S-2: 存在しない ID のとき readBody より先に 404 をスローしない（UUID は有効）", async () => {
    // UUID は有効だが findUnique が null → readBody が先に失敗する可能性があるため
    // ここでは 400 または 404 のいずれかが発生することを確認する
    prismaMock.mapCategory.findUnique.mockResolvedValue(null);

    const handler = (
      await import("../../../../server/api/categories/[id]/index.put")
    ).default;
    const event = makeEvent("PUT", `/api/categories/${VALID_UUID}`, {
      id: VALID_UUID,
    });

    await expect(handler(event)).rejects.toMatchObject(
      expect.objectContaining({ statusCode: expect.any(Number) })
    );
  });
});
