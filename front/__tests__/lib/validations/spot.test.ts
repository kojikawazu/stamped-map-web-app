import { describe, it, expect } from "vitest";
import { createSpotSchema } from "../../../lib/validations/spot";

const validSpot = {
  name: "東京タワー",
  categoryId: "550e8400-e29b-41d4-a716-446655440000",
  latitude: 35.6586,
  longitude: 139.7454,
  visitedAt: "2026-01-01",
};

describe("createSpotSchema", () => {
  it("正常な入力を受け入れる", () => {
    const result = createSpotSchema.safeParse(validSpot);
    expect(result.success).toBe(true);
  });

  it("name が空のときバリデーションエラーになる", () => {
    const result = createSpotSchema.safeParse({ ...validSpot, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("name");
    }
  });

  it("name が101文字以上のときバリデーションエラーになる", () => {
    const result = createSpotSchema.safeParse({ ...validSpot, name: "a".repeat(101) });
    expect(result.success).toBe(false);
  });

  it("categoryId が UUID 形式でないときバリデーションエラーになる", () => {
    const result = createSpotSchema.safeParse({ ...validSpot, categoryId: "not-uuid" });
    expect(result.success).toBe(false);
  });

  it("latitude が範囲外のときバリデーションエラーになる", () => {
    expect(createSpotSchema.safeParse({ ...validSpot, latitude: -91 }).success).toBe(false);
    expect(createSpotSchema.safeParse({ ...validSpot, latitude: 91 }).success).toBe(false);
  });

  it("longitude が範囲外のときバリデーションエラーになる", () => {
    expect(createSpotSchema.safeParse({ ...validSpot, longitude: -181 }).success).toBe(false);
    expect(createSpotSchema.safeParse({ ...validSpot, longitude: 181 }).success).toBe(false);
  });

  it("visitedAt が YYYY-MM-DD 形式でないときバリデーションエラーになる", () => {
    const result = createSpotSchema.safeParse({ ...validSpot, visitedAt: "2026/01/01" });
    expect(result.success).toBe(false);
  });

  it("visitedAt が存在しない日付のときバリデーションエラーになる", () => {
    const result = createSpotSchema.safeParse({ ...validSpot, visitedAt: "2026-02-30" });
    expect(result.success).toBe(false);
  });

  it("memo が空文字のとき許容する", () => {
    const result = createSpotSchema.safeParse({ ...validSpot, memo: "" });
    expect(result.success).toBe(true);
  });

  it("memo が1001文字以上のときバリデーションエラーになる", () => {
    const result = createSpotSchema.safeParse({ ...validSpot, memo: "a".repeat(1001) });
    expect(result.success).toBe(false);
  });
});
