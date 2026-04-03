import { describe, it, expect } from "vitest";
import {
  buildSpotWhereClause,
  isValidUuid,
  getValidationErrorDetails,
  formatCategoryResponse,
  formatSpotResponse,
  formatMarkerResponse,
} from "../../../server/utils/api-helpers";

describe("buildSpotWhereClause", () => {
  it("空クエリのとき WHERE 句が空オブジェクトになる", () => {
    const result = buildSpotWhereClause({});
    expect(result).toEqual({});
  });

  it("category パラメーターを categoryId の IN 句に変換する", () => {
    const result = buildSpotWhereClause({ category: "cat-1,cat-2" });
    expect(result).toEqual({
      AND: [{ categoryId: { in: ["cat-1", "cat-2"] } }],
    });
  });

  it("category が配列のとき最初の要素を使用する", () => {
    const result = buildSpotWhereClause({ category: ["cat-1,cat-2", "ignored"] });
    expect(result).toEqual({
      AND: [{ categoryId: { in: ["cat-1", "cat-2"] } }],
    });
  });

  it("q パラメーターを name contains 検索に変換する", () => {
    const result = buildSpotWhereClause({ q: "東京" });
    expect(result).toEqual({
      AND: [{ name: { contains: "東京", mode: "insensitive" } }],
    });
  });

  it("category と q を同時に指定したとき AND 条件になる", () => {
    const result = buildSpotWhereClause({ category: "cat-1", q: "東京" });
    expect(result).toEqual({
      AND: [
        { categoryId: { in: ["cat-1"] } },
        { name: { contains: "東京", mode: "insensitive" } },
      ],
    });
  });

  it("category が空文字のとき条件に含まれない", () => {
    const result = buildSpotWhereClause({ category: "" });
    expect(result).toEqual({});
  });
});

describe("isValidUuid", () => {
  it("有効な UUID を true と判定する", () => {
    expect(isValidUuid("550e8400-e29b-41d4-a716-446655440000")).toBe(true);
  });

  it("無効な文字列を false と判定する", () => {
    expect(isValidUuid("not-a-uuid")).toBe(false);
    expect(isValidUuid("")).toBe(false);
    expect(isValidUuid("12345678-1234-1234-1234-12345678901g")).toBe(false);
  });
});

describe("getValidationErrorDetails", () => {
  it("Zod エラーをフィールド名→メッセージのマップに変換する", async () => {
    const { z } = await import("zod");
    const schema = z.object({
      name: z.string().min(1, "必須"),
      age: z.number().min(0, "0以上"),
    });
    const result = schema.safeParse({ name: "", age: -1 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const details = getValidationErrorDetails(result.error);
      expect(details.name).toBe("必須");
      expect(details.age).toBe("0以上");
    }
  });
});

describe("formatCategoryResponse", () => {
  it("カテゴリオブジェクトを API レスポンス形式にフォーマットする", () => {
    const category = {
      id: "cat-1",
      name: "カフェ",
      color: "#FF0000",
      isDefault: false,
      sortOrder: 1,
    };
    const result = formatCategoryResponse(category, 5);
    expect(result).toEqual({
      id: "cat-1",
      name: "カフェ",
      color: "#FF0000",
      isDefault: false,
      sortOrder: 1,
      spotCount: 5,
    });
  });

  it("spotCount が 0 のときも正しくフォーマットされる", () => {
    const category = {
      id: "cat-2",
      name: "レストラン",
      color: "#00FF00",
      isDefault: true,
      sortOrder: 2,
    };
    const result = formatCategoryResponse(category, 0);
    expect(result.spotCount).toBe(0);
    expect(result.isDefault).toBe(true);
  });
});

describe("formatSpotResponse", () => {
  const baseSpot = {
    id: "spot-1",
    name: "東京タワー",
    category: { id: "cat-1", name: "観光地", color: "#FF5733" },
    latitude: 35.6586,
    longitude: 139.7454,
    visitedAt: new Date("2026-01-15T00:00:00.000Z"),
    memo: "素晴らしい景色",
    imageUrl: null,
    createdAt: new Date("2026-01-15T12:00:00.000Z"),
    updatedAt: new Date("2026-01-15T12:00:00.000Z"),
  };

  it("スポットオブジェクトを API レスポンス形式にフォーマットする", () => {
    const result = formatSpotResponse(baseSpot);
    expect(result).toEqual({
      id: "spot-1",
      name: "東京タワー",
      category: { id: "cat-1", name: "観光地", color: "#FF5733" },
      latitude: 35.6586,
      longitude: 139.7454,
      visitedAt: "2026-01-15",
      memo: "素晴らしい景色",
      imageUrl: null,
      createdAt: "2026-01-15T12:00:00.000Z",
      updatedAt: "2026-01-15T12:00:00.000Z",
    });
  });

  it("visitedAt を YYYY-MM-DD 形式に変換する", () => {
    const result = formatSpotResponse(baseSpot);
    expect(result.visitedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("memo が null のとき null のまま返す", () => {
    const result = formatSpotResponse({ ...baseSpot, memo: null });
    expect(result.memo).toBeNull();
  });
});

describe("formatMarkerResponse", () => {
  const baseMarker = {
    id: "spot-1",
    name: "東京タワー",
    latitude: 35.6586,
    longitude: 139.7454,
    categoryId: "cat-1",
    category: { color: "#FF5733" },
  };

  it("マーカーオブジェクトを API レスポンス形式にフォーマットする", () => {
    const result = formatMarkerResponse(baseMarker);
    expect(result).toEqual({
      id: "spot-1",
      name: "東京タワー",
      latitude: 35.6586,
      longitude: 139.7454,
      categoryId: "cat-1",
      categoryColor: "#FF5733",
    });
  });

  it("category.color が categoryColor としてフラット化される", () => {
    const result = formatMarkerResponse(baseMarker);
    expect(result).not.toHaveProperty("category");
    expect(result.categoryColor).toBe("#FF5733");
  });
});
