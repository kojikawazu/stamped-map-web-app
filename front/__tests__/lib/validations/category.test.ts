import { describe, it, expect } from "vitest";
import { createCategorySchema } from "../../../lib/validations/category";

describe("createCategorySchema", () => {
  it("正常な入力を受け入れる", () => {
    // createCategorySchema は name + color のみ定義（sortOrder は別途管理）
    const result = createCategorySchema.safeParse({
      name: "カフェ",
      color: "#FF5733",
    });
    expect(result.success).toBe(true);
  });

  it("name が空のときバリデーションエラーになる", () => {
    const result = createCategorySchema.safeParse({ name: "", color: "#FF5733" });
    expect(result.success).toBe(false);
  });

  it("name が51文字以上のときバリデーションエラーになる", () => {
    const result = createCategorySchema.safeParse({ name: "a".repeat(51), color: "#FF5733" });
    expect(result.success).toBe(false);
  });

  it("color が # で始まらないときバリデーションエラーになる", () => {
    const result = createCategorySchema.safeParse({ name: "カフェ", color: "FF5733" });
    expect(result.success).toBe(false);
  });

  it("color が省略されたときバリデーションエラーになる（必須）", () => {
    const result = createCategorySchema.safeParse({ name: "カフェ" });
    expect(result.success).toBe(false);
  });
});
