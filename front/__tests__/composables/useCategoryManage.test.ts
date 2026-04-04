import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockApiFetch, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockApiFetch: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock("vue-sonner", () => ({
  toast: {
    success: mockToastSuccess,
    error: mockToastError,
  },
}));

vi.mock("~/composables/useApiClient", () => ({
  useApiClient: () => ({ apiFetch: mockApiFetch }),
}));

describe("useCategoryManage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateCategory", () => {
    it("更新成功時: Category を返し、成功トーストを表示する", async () => {
      const cat = { id: "cat-1", name: "カフェ", color: "#FF5733", isDefault: false, sortOrder: 1, spotCount: 3 };
      mockApiFetch.mockResolvedValue({ data: cat });

      const { updateCategory, editLoading, editError } = useCategoryManage();
      const result = await updateCategory("cat-1", { name: "カフェ", color: "#FF5733" });

      expect(result).toEqual(cat);
      expect(mockToastSuccess).toHaveBeenCalledWith("カテゴリを更新しました");
      expect(editLoading.value).toBe(false);
      expect(editError.value).toBeNull();
    });

    it("バリデーション失敗時: null を返し、editError を設定する", async () => {
      const { updateCategory, editError } = useCategoryManage();
      const result = await updateCategory("cat-1", { name: "", color: "#FF5733" });

      expect(result).toBeNull();
      expect(mockApiFetch).not.toHaveBeenCalled();
      expect(editError.value).toBeTruthy();
    });

    it("更新失敗時: null を返し、エラートーストを表示する", async () => {
      mockApiFetch.mockRejectedValue(new Error("Network error"));

      const { updateCategory, editError } = useCategoryManage();
      const result = await updateCategory("cat-1", { name: "カフェ", color: "#FF5733" });

      expect(result).toBeNull();
      expect(mockToastError).toHaveBeenCalledWith("更新に失敗しました");
      expect(editError.value).toBe("カテゴリの更新に失敗しました");
    });
  });

  describe("deleteCategory", () => {
    it("削除成功時: true を返し、成功トーストを表示する", async () => {
      mockApiFetch.mockResolvedValue(undefined);

      const { deleteCategory } = useCategoryManage();
      const result = await deleteCategory("cat-1");

      expect(result).toBe(true);
      expect(mockApiFetch).toHaveBeenCalledWith("/api/categories/cat-1", { method: "DELETE" });
      expect(mockToastSuccess).toHaveBeenCalledWith("カテゴリを削除しました");
    });

    it("削除失敗時: false を返し、エラートーストを表示する", async () => {
      mockApiFetch.mockRejectedValue(new Error("Network error"));

      const { deleteCategory } = useCategoryManage();
      const result = await deleteCategory("cat-1");

      expect(result).toBe(false);
      expect(mockToastError).toHaveBeenCalled();
    });
  });

  describe("clearEditError", () => {
    it("editError をリセットする", async () => {
      mockApiFetch.mockRejectedValue(new Error("fail"));
      const { updateCategory, editError, clearEditError } = useCategoryManage();
      await updateCategory("cat-1", { name: "カフェ", color: "#FF5733" });
      expect(editError.value).not.toBeNull();

      clearEditError();
      expect(editError.value).toBeNull();
    });
  });
});
