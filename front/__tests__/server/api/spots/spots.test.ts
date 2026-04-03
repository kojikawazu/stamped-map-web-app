import { describe, it, expect, vi, beforeEach } from "vitest";
import { createEvent } from "h3";
import { IncomingMessage, ServerResponse } from "node:http";

// --- モック定義 ---
// verifyAuth と prisma は Nitro オートインポートのためグローバルスタブで差し替える

const prismaMock = {
  mapSpot: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  },
  mapCategory: {
    findUnique: vi.fn(),
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
const VALID_UUID_2 = "660e8400-e29b-41d4-a716-446655440000";

const mockCategory = { id: VALID_UUID_2, name: "カフェ", color: "#FF0000" };
const mockSpot = {
  id: VALID_UUID,
  name: "東京タワー",
  category: mockCategory,
  latitude: 35.6586,
  longitude: 139.7454,
  visitedAt: new Date("2026-01-15T00:00:00.000Z"),
  memo: "素晴らしい",
  imageUrl: null,
  createdAt: new Date("2026-01-15T12:00:00.000Z"),
  updatedAt: new Date("2026-01-15T12:00:00.000Z"),
};

// --- GET /api/spots ---

describe("GET /api/spots", () => {
  beforeEach(() => vi.clearAllMocks());

  it("N-1: スポット一覧とページネーションを返す", async () => {
    prismaMock.mapSpot.findMany.mockResolvedValue([mockSpot]);
    prismaMock.mapSpot.count.mockResolvedValue(1);

    const handler = (
      await import("../../../../server/api/spots/index.get")
    ).default;
    const event = makeEvent("GET", "/api/spots");
    const result = await handler(event);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe("東京タワー");
    expect(result.pagination.total).toBe(1);
  });

  it("N-2: page と limit クエリが反映される", async () => {
    prismaMock.mapSpot.findMany.mockResolvedValue([]);
    prismaMock.mapSpot.count.mockResolvedValue(50);

    const handler = (
      await import("../../../../server/api/spots/index.get")
    ).default;
    const event = makeEvent("GET", "/api/spots?page=2&limit=10");
    const result = await handler(event);

    expect(result.pagination.page).toBe(2);
    expect(result.pagination.limit).toBe(10);
  });

  it("S-1: page に不正な値を渡すと page=1 にフォールバックする", async () => {
    prismaMock.mapSpot.findMany.mockResolvedValue([]);
    prismaMock.mapSpot.count.mockResolvedValue(0);

    const handler = (
      await import("../../../../server/api/spots/index.get")
    ).default;
    const event = makeEvent("GET", "/api/spots?page=abc");
    const result = await handler(event);

    expect(result.pagination.page).toBe(1);
  });
});

// --- GET /api/spots/:id ---

describe("GET /api/spots/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("N-1: 存在するスポット ID でスポットを返す", async () => {
    prismaMock.mapSpot.findUnique.mockResolvedValue(mockSpot);

    const handler = (
      await import("../../../../server/api/spots/[id]/index.get")
    ).default;
    const event = makeEvent("GET", `/api/spots/${VALID_UUID}`, {
      id: VALID_UUID,
    });
    const result = await handler(event);

    expect(result.data.id).toBe(VALID_UUID);
    expect(result.data.name).toBe("東京タワー");
  });

  it("S-1: 存在しない ID のとき 404 をスローする", async () => {
    prismaMock.mapSpot.findUnique.mockResolvedValue(null);

    const handler = (
      await import("../../../../server/api/spots/[id]/index.get")
    ).default;
    const event = makeEvent("GET", `/api/spots/${VALID_UUID}`, {
      id: VALID_UUID,
    });

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("S-2: 不正な UUID フォーマットのとき 400 をスローする", async () => {
    const handler = (
      await import("../../../../server/api/spots/[id]/index.get")
    ).default;
    const event = makeEvent("GET", "/api/spots/invalid-id", {
      id: "invalid-id",
    });

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 });
  });
});

// --- DELETE /api/spots/:id ---

describe("DELETE /api/spots/:id", () => {
  beforeEach(() => vi.clearAllMocks());

  it("N-1: 存在するスポットを削除して id を返す", async () => {
    prismaMock.mapSpot.findUnique.mockResolvedValue(mockSpot);
    prismaMock.mapSpot.delete.mockResolvedValue(mockSpot);

    const handler = (
      await import("../../../../server/api/spots/[id]/index.delete")
    ).default;
    const event = makeEvent("DELETE", `/api/spots/${VALID_UUID}`, {
      id: VALID_UUID,
    });
    const result = await handler(event);

    expect(result.data.id).toBe(VALID_UUID);
    expect(prismaMock.mapSpot.delete).toHaveBeenCalledWith({
      where: { id: VALID_UUID },
    });
  });

  it("S-1: 存在しない ID のとき 404 をスローする", async () => {
    prismaMock.mapSpot.findUnique.mockResolvedValue(null);

    const handler = (
      await import("../../../../server/api/spots/[id]/index.delete")
    ).default;
    const event = makeEvent("DELETE", `/api/spots/${VALID_UUID}`, {
      id: VALID_UUID,
    });

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("S-2: 不正な UUID フォーマットのとき 400 をスローする", async () => {
    const handler = (
      await import("../../../../server/api/spots/[id]/index.delete")
    ).default;
    const event = makeEvent("DELETE", "/api/spots/invalid-id", {
      id: "invalid-id",
    });

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 });
  });
});

// --- GET /api/spots/markers ---

describe("GET /api/spots/markers", () => {
  beforeEach(() => vi.clearAllMocks());

  it("N-1: マーカー用軽量データ一覧を返す", async () => {
    const mockMarkerData = [
      {
        id: VALID_UUID,
        name: "東京タワー",
        latitude: 35.6586,
        longitude: 139.7454,
        categoryId: VALID_UUID_2,
        category: { color: "#FF0000" },
      },
    ];
    prismaMock.mapSpot.findMany.mockResolvedValue(mockMarkerData);

    const handler = (
      await import("../../../../server/api/spots/markers.get")
    ).default;
    const event = makeEvent("GET", "/api/spots/markers");
    const result = await handler(event);

    expect(result.data).toHaveLength(1);
    expect(result.data[0]).toMatchObject({
      id: VALID_UUID,
      name: "東京タワー",
      categoryColor: "#FF0000",
    });
    expect(result.data[0]).not.toHaveProperty("category");
  });

  it("N-2: カテゴリフィルターを渡すと where 条件が適用される", async () => {
    prismaMock.mapSpot.findMany.mockResolvedValue([]);

    const handler = (
      await import("../../../../server/api/spots/markers.get")
    ).default;
    const event = makeEvent("GET", `/api/spots/markers?category=${VALID_UUID_2}`);
    await handler(event);

    expect(prismaMock.mapSpot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { AND: [{ categoryId: { in: [VALID_UUID_2] } }] },
      })
    );
  });
});
