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
  it("N-1: 正常な入力を受け入れる", () => {
    const result = createSpotSchema.safeParse(validSpot);
    expect(result.success).toBe(true);
  });

  it("S-1: name が空のときバリデーションエラーになる", () => {
    const result = createSpotSchema.safeParse({ ...validSpot, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain("name");
    }
  });

  it("S-2: name が 101 文字以上のときバリデーションエラーになる", () => {
    const result = createSpotSchema.safeParse({
      ...validSpot,
      name: "a".repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it("S-3: categoryId が UUID 形式でないときバリデーションエラーになる", () => {
    const result = createSpotSchema.safeParse({
      ...validSpot,
      categoryId: "not-uuid",
    });
    expect(result.success).toBe(false);
  });

  it("S-4: latitude が範囲外のときバリデーションエラーになる", () => {
    expect(
      createSpotSchema.safeParse({ ...validSpot, latitude: -91 }).success,
    ).toBe(false);
    expect(
      createSpotSchema.safeParse({ ...validSpot, latitude: 91 }).success,
    ).toBe(false);
  });

  it("S-5: longitude が範囲外のときバリデーションエラーになる", () => {
    expect(
      createSpotSchema.safeParse({ ...validSpot, longitude: -181 }).success,
    ).toBe(false);
    expect(
      createSpotSchema.safeParse({ ...validSpot, longitude: 181 }).success,
    ).toBe(false);
  });

  it("S-6: visitedAt が YYYY-MM-DD 形式でないときバリデーションエラーになる", () => {
    const result = createSpotSchema.safeParse({
      ...validSpot,
      visitedAt: "2026/01/01",
    });
    expect(result.success).toBe(false);
  });

  it("S-7: visitedAt が存在しない日付のときバリデーションエラーになる", () => {
    const result = createSpotSchema.safeParse({
      ...validSpot,
      visitedAt: "2026-02-30",
    });
    expect(result.success).toBe(false);
  });

  it("S-8: visitedAt が未来の日付のときバリデーションエラーになる", () => {
    const result = createSpotSchema.safeParse({
      ...validSpot,
      visitedAt: "2099-12-31",
    });
    expect(result.success).toBe(false);
  });

  it("S-9: name が 100 文字のとき許容する（上限境界値）", () => {
    const result = createSpotSchema.safeParse({
      ...validSpot,
      name: "a".repeat(100),
    });
    expect(result.success).toBe(true);
  });

  it("S-10: latitude がちょうど ±90 のとき許容する（境界値）", () => {
    expect(
      createSpotSchema.safeParse({ ...validSpot, latitude: 90 }).success,
    ).toBe(true);
    expect(
      createSpotSchema.safeParse({ ...validSpot, latitude: -90 }).success,
    ).toBe(true);
  });

  it("S-11: longitude がちょうど ±180 のとき許容する（境界値）", () => {
    expect(
      createSpotSchema.safeParse({ ...validSpot, longitude: 180 }).success,
    ).toBe(true);
    expect(
      createSpotSchema.safeParse({ ...validSpot, longitude: -180 }).success,
    ).toBe(true);
  });

  it("S-12: memo が空文字のとき許容する（下限境界値）", () => {
    const result = createSpotSchema.safeParse({ ...validSpot, memo: "" });
    expect(result.success).toBe(true);
  });

  it("S-13: memo が 1001 文字以上のときバリデーションエラーになる", () => {
    const result = createSpotSchema.safeParse({
      ...validSpot,
      memo: "a".repeat(1001),
    });
    expect(result.success).toBe(false);
  });
});
