import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockApiFetch } = vi.hoisted(() => ({
  mockApiFetch: vi.fn(),
}));

vi.mock("~/composables/useApiClient", () => ({
  useApiClient: () => ({ apiFetch: mockApiFetch }),
}));

describe("useCategoryCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("正常系: カテゴリを作成して返す", async () => {
    const created = { id: "cat-1", name: "グルメ", color: "#EF4444", isDefault: false, sortOrder: 6, spotCount: 0 };
    mockApiFetch.mockResolvedValue({ data: created });

    const { createCategory, loading, error } = useCategoryCreate();
    const result = await createCategory({ name: "グルメ", color: "#EF4444" });

    expect(result).toEqual(created);
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it("バリデーションエラー: 名前が空の場合は null を返し error をセット", async () => {
    const { createCategory, error } = useCategoryCreate();
    const result = await createCategory({ name: "", color: "#EF4444" });

    expect(result).toBeNull();
    expect(error.value).toBeTruthy();
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it("バリデーションエラー: カラーコード形式が不正の場合は null を返す", async () => {
    const { createCategory, error } = useCategoryCreate();
    const result = await createCategory({ name: "グルメ", color: "red" });

    expect(result).toBeNull();
    expect(error.value).toBeTruthy();
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it("APIエラー: 失敗時は null を返し error をセット", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"));

    const { createCategory, error } = useCategoryCreate();
    const result = await createCategory({ name: "グルメ", color: "#EF4444" });

    expect(result).toBeNull();
    expect(error.value).toBe("カテゴリの追加に失敗しました");
  });

  it("API 呼び出し中は loading が true になる", async () => {
    let resolveFn!: (v: unknown) => void;
    mockApiFetch.mockReturnValue(new Promise((r) => (resolveFn = r)));

    const { createCategory, loading } = useCategoryCreate();
    const promise = createCategory({ name: "グルメ", color: "#EF4444" });
    expect(loading.value).toBe(true);
    resolveFn({ data: { id: "cat-1", name: "グルメ", color: "#EF4444", isDefault: false, sortOrder: 6, spotCount: 0 } });
    await promise;
    expect(loading.value).toBe(false);
  });
});
