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

// verifyAuth / verifyOwner はハンドルを保持し、異常系（401/403）テストで
// mockRejectedValueOnce により1回だけ失敗させられるようにする。
const verifyAuthMock = vi
  .fn()
  .mockResolvedValue({ id: "user-1", email: "owner@example.com" });
const verifyOwnerMock = vi
  .fn()
  .mockResolvedValue({ id: "user-1", email: "owner@example.com" });
vi.stubGlobal("verifyAuth", verifyAuthMock);
vi.stubGlobal("verifyOwner", verifyOwnerMock);
vi.stubGlobal("prisma", prismaMock);

// 403（オーナー限定違反）を表す createError 相当のエラー。
const forbiddenError = () =>
  Object.assign(new Error("オーナー権限が必要です"), { statusCode: 403 });

// readBody は POST ハンドラーで使用されるため、テストごとに戻り値を設定できるよう差し替える
const mockReadBody = vi.fn();
vi.stubGlobal("readBody", mockReadBody);

// --- テストヘルパー ---

function makeEvent(
  method: string,
  path: string,
  params?: Record<string, string>,
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

    const handler = (await import("../../../../server/api/spots/index.get"))
      .default;
    const event = makeEvent("GET", "/api/spots");
    const result = await handler(event);

    expect(result.data).toHaveLength(1);
    expect(result.data[0].name).toBe("東京タワー");
    expect(result.pagination.total).toBe(1);
  });

  it("N-2: page と limit クエリが反映される", async () => {
    prismaMock.mapSpot.findMany.mockResolvedValue([]);
    prismaMock.mapSpot.count.mockResolvedValue(50);

    const handler = (await import("../../../../server/api/spots/index.get"))
      .default;
    const event = makeEvent("GET", "/api/spots?page=2&limit=10");
    const result = await handler(event);

    expect(result.pagination.page).toBe(2);
    expect(result.pagination.limit).toBe(10);
  });

  it("S-1: page に不正な値を渡すと page=1 にフォールバックする", async () => {
    prismaMock.mapSpot.findMany.mockResolvedValue([]);
    prismaMock.mapSpot.count.mockResolvedValue(0);

    const handler = (await import("../../../../server/api/spots/index.get"))
      .default;
    const event = makeEvent("GET", "/api/spots?page=abc");
    const result = await handler(event);

    expect(result.pagination.page).toBe(1);
  });

  it("A-1: verifyAuth が 401 をスローするとハンドラが伝播する", async () => {
    verifyAuthMock.mockRejectedValueOnce(
      Object.assign(new Error("認証が無効です"), { statusCode: 401 }),
    );

    const handler = (await import("../../../../server/api/spots/index.get"))
      .default;
    const event = makeEvent("GET", "/api/spots");

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 401 });
    expect(prismaMock.mapSpot.findMany).not.toHaveBeenCalled();
  });

  it("A-2: DB アクセスが失敗すると例外が伝播する", async () => {
    prismaMock.mapSpot.findMany.mockRejectedValue(
      new Error("DB connection failed"),
    );
    prismaMock.mapSpot.count.mockResolvedValue(0);

    const handler = (await import("../../../../server/api/spots/index.get"))
      .default;
    const event = makeEvent("GET", "/api/spots");

    await expect(handler(event)).rejects.toThrow("DB connection failed");
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

  it("A-1: 非オーナー（verifyOwner が 403）のとき削除せず 403 を伝播する", async () => {
    verifyOwnerMock.mockRejectedValueOnce(forbiddenError());

    const handler = (
      await import("../../../../server/api/spots/[id]/index.delete")
    ).default;
    const event = makeEvent("DELETE", `/api/spots/${VALID_UUID}`, {
      id: VALID_UUID,
    });

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.mapSpot.delete).not.toHaveBeenCalled();
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

    const handler = (await import("../../../../server/api/spots/markers.get"))
      .default;
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

    const handler = (await import("../../../../server/api/spots/markers.get"))
      .default;
    const event = makeEvent(
      "GET",
      `/api/spots/markers?category=${VALID_UUID_2}`,
    );
    await handler(event);

    expect(prismaMock.mapSpot.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { AND: [{ categoryId: { in: [VALID_UUID_2] } }] },
      }),
    );
  });
});

// --- POST /api/spots ---

describe("POST /api/spots", () => {
  const validBody = {
    name: "東京スカイツリー",
    categoryId: VALID_UUID_2,
    latitude: 35.7101,
    longitude: 139.8107,
    visitedAt: "2025-01-01",
    memo: "展望台から富士山が見えた",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockReadBody.mockReset();
  });

  it("N-1: 有効なリクエストボディでスポットを作成して 201 を返す", async () => {
    mockReadBody.mockResolvedValue(validBody);
    prismaMock.mapCategory.findUnique.mockResolvedValue(mockCategory);
    const createdSpot = {
      ...mockSpot,
      id: "770e8400-e29b-41d4-a716-446655440000",
      name: "東京スカイツリー",
      latitude: 35.7101,
      longitude: 139.8107,
      categoryId: VALID_UUID_2,
      category: mockCategory,
    };
    prismaMock.mapSpot.create.mockResolvedValue(createdSpot);

    const handler = (await import("../../../../server/api/spots/index.post"))
      .default;
    const event = makeEvent("POST", "/api/spots");
    const result = await handler(event);

    expect(result.data.name).toBe("東京スカイツリー");
    expect(prismaMock.mapSpot.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "東京スカイツリー",
          categoryId: VALID_UUID_2,
          latitude: 35.7101,
          longitude: 139.8107,
        }),
      }),
    );
  });

  it("S-1: バリデーションエラー（必須フィールド欠如）のとき 400 をスローする", async () => {
    mockReadBody.mockResolvedValue({ name: "", categoryId: VALID_UUID_2 });

    const handler = (await import("../../../../server/api/spots/index.post"))
      .default;
    const event = makeEvent("POST", "/api/spots");

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: "VALIDATION_ERROR" },
    });
    expect(prismaMock.mapSpot.create).not.toHaveBeenCalled();
  });

  it("S-2: 存在しないカテゴリ ID のとき 400 をスローする", async () => {
    mockReadBody.mockResolvedValue(validBody);
    prismaMock.mapCategory.findUnique.mockResolvedValue(null);

    const handler = (await import("../../../../server/api/spots/index.post"))
      .default;
    const event = makeEvent("POST", "/api/spots");

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: "VALIDATION_ERROR" },
    });
    expect(prismaMock.mapSpot.create).not.toHaveBeenCalled();
  });

  it("A-1: 非オーナー（verifyOwner が 403）のとき作成せず 403 を伝播する", async () => {
    verifyOwnerMock.mockRejectedValueOnce(forbiddenError());

    const handler = (await import("../../../../server/api/spots/index.post"))
      .default;
    const event = makeEvent("POST", "/api/spots");

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 });
    expect(mockReadBody).not.toHaveBeenCalled();
    expect(prismaMock.mapSpot.create).not.toHaveBeenCalled();
  });

  it("A-2: DB 書き込みが失敗すると例外が伝播する", async () => {
    mockReadBody.mockResolvedValue(validBody);
    prismaMock.mapCategory.findUnique.mockResolvedValue(mockCategory);
    prismaMock.mapSpot.create.mockRejectedValue(new Error("DB write failed"));

    const handler = (await import("../../../../server/api/spots/index.post"))
      .default;
    const event = makeEvent("POST", "/api/spots");

    await expect(handler(event)).rejects.toThrow("DB write failed");
  });
});

// --- PUT /api/spots/:id ---

describe("PUT /api/spots/:id", () => {
  const validBody = {
    name: "更新後スポット",
    categoryId: VALID_UUID_2,
    latitude: 35.6812,
    longitude: 139.7671,
    visitedAt: "2025-02-01",
    memo: "更新メモ",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockReadBody.mockReset();
  });

  it("N-1: 有効なボディでスポットを更新する", async () => {
    mockReadBody.mockResolvedValue(validBody);
    prismaMock.mapSpot.findUnique.mockResolvedValue(mockSpot);
    prismaMock.mapCategory.findUnique.mockResolvedValue(mockCategory);
    prismaMock.mapSpot.update.mockResolvedValue({
      ...mockSpot,
      name: "更新後スポット",
      category: mockCategory,
    });

    const handler = (
      await import("../../../../server/api/spots/[id]/index.put")
    ).default;
    const event = makeEvent("PUT", `/api/spots/${VALID_UUID}`, {
      id: VALID_UUID,
    });
    const result = await handler(event);

    expect(result.data.name).toBe("更新後スポット");
    expect(prismaMock.mapSpot.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: VALID_UUID } }),
    );
  });

  it("S-1: 不正な UUID フォーマットのとき 400 をスローする", async () => {
    const handler = (
      await import("../../../../server/api/spots/[id]/index.put")
    ).default;
    const event = makeEvent("PUT", "/api/spots/invalid-id", {
      id: "invalid-id",
    });

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 });
  });

  it("S-2: 存在しない ID のとき 404 をスローする", async () => {
    mockReadBody.mockResolvedValue(validBody);
    prismaMock.mapSpot.findUnique.mockResolvedValue(null);

    const handler = (
      await import("../../../../server/api/spots/[id]/index.put")
    ).default;
    const event = makeEvent("PUT", `/api/spots/${VALID_UUID}`, {
      id: VALID_UUID,
    });

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 });
    expect(prismaMock.mapSpot.update).not.toHaveBeenCalled();
  });

  it("S-3: 存在しないカテゴリ ID のとき 400 をスローする", async () => {
    mockReadBody.mockResolvedValue(validBody);
    prismaMock.mapSpot.findUnique.mockResolvedValue(mockSpot);
    prismaMock.mapCategory.findUnique.mockResolvedValue(null);

    const handler = (
      await import("../../../../server/api/spots/[id]/index.put")
    ).default;
    const event = makeEvent("PUT", `/api/spots/${VALID_UUID}`, {
      id: VALID_UUID,
    });

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: "VALIDATION_ERROR" },
    });
    expect(prismaMock.mapSpot.update).not.toHaveBeenCalled();
  });

  it("S-4: バリデーションエラー（必須フィールド欠如）のとき DB 到達前に 400 をスローする", async () => {
    mockReadBody.mockResolvedValue({ name: "" });

    const handler = (
      await import("../../../../server/api/spots/[id]/index.put")
    ).default;
    const event = makeEvent("PUT", `/api/spots/${VALID_UUID}`, {
      id: VALID_UUID,
    });

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: "VALIDATION_ERROR" },
    });
    expect(prismaMock.mapSpot.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.mapSpot.update).not.toHaveBeenCalled();
  });

  it("A-1: 非オーナー（verifyOwner が 403）のとき更新せず 403 を伝播する", async () => {
    verifyOwnerMock.mockRejectedValueOnce(forbiddenError());

    const handler = (
      await import("../../../../server/api/spots/[id]/index.put")
    ).default;
    const event = makeEvent("PUT", `/api/spots/${VALID_UUID}`, {
      id: VALID_UUID,
    });

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.mapSpot.update).not.toHaveBeenCalled();
  });
});
