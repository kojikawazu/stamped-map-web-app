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

describe("useSpotDelete", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("削除成功時: true を返し、成功トーストを表示する", async () => {
    mockApiFetch.mockResolvedValue(undefined);

    const { deleteSpot, loading } = useSpotDelete();
    const result = await deleteSpot("spot-1");

    expect(result).toBe(true);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/spots/spot-1", { method: "DELETE" });
    expect(mockToastSuccess).toHaveBeenCalledWith("スポットを削除しました");
    expect(loading.value).toBe(false);
  });

  it("削除失敗時: false を返し、エラートーストを表示する", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"));

    const { deleteSpot, loading } = useSpotDelete();
    const result = await deleteSpot("spot-1");

    expect(result).toBe(false);
    expect(mockToastError).toHaveBeenCalledWith("削除に失敗しました");
    expect(loading.value).toBe(false);
  });

  it("API 呼び出し中は loading が true になる", async () => {
    let resolveFn!: (v: unknown) => void;
    mockApiFetch.mockReturnValue(new Promise((r) => (resolveFn = r)));

    const { deleteSpot, loading } = useSpotDelete();
    const promise = deleteSpot("spot-1");
    expect(loading.value).toBe(true);
    resolveFn(undefined);
    await promise;
    expect(loading.value).toBe(false);
  });
});
