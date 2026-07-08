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

// readBody は PUT などボディを読む必要があるハンドラーで使用されるため、テストごとに戻り値を設定できるよう差し替える
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
      expect.objectContaining({ orderBy: { sortOrder: "asc" } }),
    );
  });

  it("A-1: DB アクセスが失敗すると例外が伝播する", async () => {
    prismaMock.mapCategory.findMany.mockRejectedValue(new Error("DB down"));

    const handler = (
      await import("../../../../server/api/categories/index.get")
    ).default;
    const event = makeEvent("GET", "/api/categories");

    await expect(handler(event)).rejects.toThrow("DB down");
  });
});

// --- POST /api/categories ---

describe("POST /api/categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadBody.mockReset();
  });

  it("N-1: 有効なボディでカテゴリを作成して 201 を返す", async () => {
    mockReadBody.mockResolvedValue({ name: "公園", color: "#00AA00" });
    prismaMock.mapCategory.findUnique.mockResolvedValue(null);
    prismaMock.mapCategory.aggregate.mockResolvedValue({
      _max: { sortOrder: 4 },
    });
    prismaMock.mapCategory.create.mockResolvedValue({
      id: VALID_UUID,
      name: "公園",
      color: "#00AA00",
      isDefault: false,
      sortOrder: 5,
    });

    const handler = (
      await import("../../../../server/api/categories/index.post")
    ).default;
    const event = makeEvent("POST", "/api/categories");
    const result = await handler(event);

    expect(result.data).toMatchObject({ name: "公園", color: "#00AA00" });
    expect(prismaMock.mapCategory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "公園",
          color: "#00AA00",
          isDefault: false,
          sortOrder: 5,
        }),
      }),
    );
  });

  it("N-2: 既存カテゴリが無いとき sortOrder は 1 から採番される", async () => {
    mockReadBody.mockResolvedValue({ name: "神社", color: "#AA0000" });
    prismaMock.mapCategory.findUnique.mockResolvedValue(null);
    prismaMock.mapCategory.aggregate.mockResolvedValue({
      _max: { sortOrder: null },
    });
    prismaMock.mapCategory.create.mockResolvedValue({
      id: VALID_UUID,
      name: "神社",
      color: "#AA0000",
      isDefault: false,
      sortOrder: 1,
    });

    const handler = (
      await import("../../../../server/api/categories/index.post")
    ).default;
    const event = makeEvent("POST", "/api/categories");
    await handler(event);

    expect(prismaMock.mapCategory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ sortOrder: 1 }),
      }),
    );
  });

  it("S-1: バリデーションエラー（name 空）のとき 400 をスローする", async () => {
    mockReadBody.mockResolvedValue({ name: "", color: "#00AA00" });

    const handler = (
      await import("../../../../server/api/categories/index.post")
    ).default;
    const event = makeEvent("POST", "/api/categories");

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: "VALIDATION_ERROR" },
    });
    expect(prismaMock.mapCategory.create).not.toHaveBeenCalled();
  });

  it("S-2: 同名カテゴリが既に存在するとき 400 をスローする", async () => {
    mockReadBody.mockResolvedValue({ name: "カフェ", color: "#00AA00" });
    prismaMock.mapCategory.findUnique.mockResolvedValue(mockCategory);

    const handler = (
      await import("../../../../server/api/categories/index.post")
    ).default;
    const event = makeEvent("POST", "/api/categories");

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: "DUPLICATE_CATEGORY" },
    });
    expect(prismaMock.mapCategory.create).not.toHaveBeenCalled();
  });

  it("A-1: 非オーナー（verifyOwner が 403）のとき作成せず 403 を伝播する", async () => {
    verifyOwnerMock.mockRejectedValueOnce(forbiddenError());

    const handler = (
      await import("../../../../server/api/categories/index.post")
    ).default;
    const event = makeEvent("POST", "/api/categories");

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 });
    expect(mockReadBody).not.toHaveBeenCalled();
    expect(prismaMock.mapCategory.create).not.toHaveBeenCalled();
  });

  it("A-2: DB 書き込みが失敗すると例外が伝播する", async () => {
    mockReadBody.mockResolvedValue({ name: "公園", color: "#00AA00" });
    prismaMock.mapCategory.findUnique.mockResolvedValue(null);
    prismaMock.mapCategory.aggregate.mockResolvedValue({
      _max: { sortOrder: 0 },
    });
    prismaMock.mapCategory.create.mockRejectedValue(
      new Error("DB write failed"),
    );

    const handler = (
      await import("../../../../server/api/categories/index.post")
    ).default;
    const event = makeEvent("POST", "/api/categories");

    await expect(handler(event)).rejects.toThrow("DB write failed");
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

  it("A-1: 非オーナー（verifyOwner が 403）のとき削除せず 403 を伝播する", async () => {
    verifyOwnerMock.mockRejectedValueOnce(forbiddenError());

    const handler = (
      await import("../../../../server/api/categories/[id]/index.delete")
    ).default;
    const event = makeEvent("DELETE", `/api/categories/${VALID_UUID}`, {
      id: VALID_UUID,
    });

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.mapCategory.delete).not.toHaveBeenCalled();
  });
});

// --- PUT /api/categories/:id ---

describe("PUT /api/categories/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReadBody.mockReset();
  });

  it("N-1: 有効なリクエストボディでカテゴリを更新できる", async () => {
    mockReadBody.mockResolvedValue({ name: "新しいカフェ", color: "#00FF00" });
    prismaMock.mapCategory.findUnique.mockResolvedValue(mockCategory);
    prismaMock.mapCategory.findFirst.mockResolvedValue(null);
    const updatedCategory = {
      ...mockCategory,
      name: "新しいカフェ",
      color: "#00FF00",
      _count: { mapSpots: 3 },
    };
    prismaMock.mapCategory.update.mockResolvedValue(updatedCategory);

    const handler = (
      await import("../../../../server/api/categories/[id]/index.put")
    ).default;
    const event = makeEvent("PUT", `/api/categories/${VALID_UUID}`, {
      id: VALID_UUID,
    });
    const result = await handler(event);

    expect(result.data).toMatchObject({
      id: VALID_UUID,
      name: "新しいカフェ",
      color: "#00FF00",
    });
    expect(prismaMock.mapCategory.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: VALID_UUID },
        data: { name: "新しいカフェ", color: "#00FF00" },
      }),
    );
  });

  it("S-1: 不正な UUID フォーマットのとき 400 をスローする", async () => {
    const handler = (
      await import("../../../../server/api/categories/[id]/index.put")
    ).default;
    const event = makeEvent("PUT", "/api/categories/invalid-id", {
      id: "invalid-id",
    });

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 });
  });

  it("S-2: ボディが不正のとき、DB アクセス前に 400 をスローする", async () => {
    // readBody は null を返す → updateCategorySchema.safeParse が失敗して 400 になる
    // findUnique（404 判定）には到達しない
    mockReadBody.mockResolvedValue(null);
    prismaMock.mapCategory.findUnique.mockResolvedValue(null);

    const handler = (
      await import("../../../../server/api/categories/[id]/index.put")
    ).default;
    const event = makeEvent("PUT", `/api/categories/${VALID_UUID}`, {
      id: VALID_UUID,
    });

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 400 });
    expect(prismaMock.mapCategory.findUnique).not.toHaveBeenCalled();
  });

  it("S-3: 存在しない ID のとき 404 をスローする", async () => {
    mockReadBody.mockResolvedValue({ name: "更新後", color: "#AABBCC" });
    prismaMock.mapCategory.findUnique.mockResolvedValue(null);

    const handler = (
      await import("../../../../server/api/categories/[id]/index.put")
    ).default;
    const event = makeEvent("PUT", `/api/categories/${VALID_UUID}`, {
      id: VALID_UUID,
    });

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 404 });
  });

  it("S-4: 同名カテゴリが既に存在するとき 400 をスローする", async () => {
    mockReadBody.mockResolvedValue({ name: "既存カフェ", color: "#AABBCC" });
    prismaMock.mapCategory.findUnique.mockResolvedValue(mockCategory);
    prismaMock.mapCategory.findFirst.mockResolvedValue({
      ...mockCategory,
      id: "different-id",
      name: "既存カフェ",
    });

    const handler = (
      await import("../../../../server/api/categories/[id]/index.put")
    ).default;
    const event = makeEvent("PUT", `/api/categories/${VALID_UUID}`, {
      id: VALID_UUID,
    });

    await expect(handler(event)).rejects.toMatchObject({
      statusCode: 400,
      data: { code: "DUPLICATE_CATEGORY" },
    });
    expect(prismaMock.mapCategory.update).not.toHaveBeenCalled();
  });

  it("A-1: 非オーナー（verifyOwner が 403）のとき更新せず 403 を伝播する", async () => {
    verifyOwnerMock.mockRejectedValueOnce(forbiddenError());

    const handler = (
      await import("../../../../server/api/categories/[id]/index.put")
    ).default;
    const event = makeEvent("PUT", `/api/categories/${VALID_UUID}`, {
      id: VALID_UUID,
    });

    await expect(handler(event)).rejects.toMatchObject({ statusCode: 403 });
    expect(prismaMock.mapCategory.update).not.toHaveBeenCalled();
  });
});
