import { describe, it, expect, vi, beforeEach } from "vitest";
import { useCategoryRepository } from "../../repositories/category";

// 外部境界（認証付き $fetch）だけを差し替え、envelope の展開は本物を通す
const { mockApiFetch } = vi.hoisted(() => ({ mockApiFetch: vi.fn() }));

vi.mock("~/repositories/api-client", () => ({
  useApiClient: () => ({ apiFetch: mockApiFetch }),
}));

describe("useCategoryRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const input = { name: "カフェ", color: "#FF8800" };
  const category = { id: "cat-1", ...input, isDefault: false };

  // --- 正常系 ---

  it("N-1: list は GET し、data を展開して返す", async () => {
    mockApiFetch.mockResolvedValue({ data: [category] });

    const result = await useCategoryRepository().list();

    expect(result).toEqual([category]);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/categories");
  });

  it("N-2: create は POST し、data を展開して返す", async () => {
    mockApiFetch.mockResolvedValue({ data: category });

    const result = await useCategoryRepository().create(input);

    expect(result).toEqual(category);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/categories", {
      method: "POST",
      body: input,
    });
  });

  it("N-3: update は対象 ID へ PUT し、data を展開して返す", async () => {
    mockApiFetch.mockResolvedValue({ data: category });

    const result = await useCategoryRepository().update("cat-1", input);

    expect(result).toEqual(category);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/categories/cat-1", {
      method: "PUT",
      body: input,
    });
  });

  it("N-4: remove は対象 ID へ DELETE する", async () => {
    mockApiFetch.mockResolvedValue({ data: { id: "cat-1" } });

    await expect(
      useCategoryRepository().remove("cat-1"),
    ).resolves.toBeUndefined();
    expect(mockApiFetch).toHaveBeenCalledWith("/api/categories/cat-1", {
      method: "DELETE",
    });
  });

  // --- 準正常系 ---

  it("S-1: remove の業務エラー（使用中カテゴリ）はサーバーの data を保ったまま投げる", async () => {
    // 呼び出し側（useCategoryManage）が err.data.message をトーストに出すため、
    // repository でエラーを包み直さないことを保証する
    const inUse = Object.assign(new Error("400"), {
      data: { code: "CATEGORY_IN_USE", message: "使用中のカテゴリです" },
    });
    mockApiFetch.mockRejectedValue(inUse);

    await expect(useCategoryRepository().remove("cat-1")).rejects.toBe(inUse);
  });

  // --- 異常系 ---

  it("A-1: list の API エラーはそのまま投げる", async () => {
    mockApiFetch.mockRejectedValue(new Error("500"));

    await expect(useCategoryRepository().list()).rejects.toThrow("500");
  });
});
