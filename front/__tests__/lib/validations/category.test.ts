import { describe, it, expect } from "vitest";
import { createCategorySchema } from "../../../lib/validations/category";

describe("createCategorySchema", () => {
  it("N-1: 正常な入力を受け入れる", () => {
    // createCategorySchema は name + color のみ定義（sortOrder は別途管理）
    const result = createCategorySchema.safeParse({
      name: "カフェ",
      color: "#FF5733",
    });
    expect(result.success).toBe(true);
  });

  it("S-1: name が空のときバリデーションエラーになる", () => {
    const result = createCategorySchema.safeParse({
      name: "",
      color: "#FF5733",
    });
    expect(result.success).toBe(false);
  });

  it("S-2: name が 51 文字以上のときバリデーションエラーになる", () => {
    const result = createCategorySchema.safeParse({
      name: "a".repeat(51),
      color: "#FF5733",
    });
    expect(result.success).toBe(false);
  });

  it("S-3: color が # で始まらないときバリデーションエラーになる", () => {
    const result = createCategorySchema.safeParse({
      name: "カフェ",
      color: "FF5733",
    });
    expect(result.success).toBe(false);
  });

  it("S-4: color が省略されたときバリデーションエラーになる（必須）", () => {
    const result = createCategorySchema.safeParse({ name: "カフェ" });
    expect(result.success).toBe(false);
  });
});
