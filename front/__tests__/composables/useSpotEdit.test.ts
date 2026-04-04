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

describe("useSpotEdit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPayload = {
    name: "更新後スポット",
    categoryId: "00000000-0000-0000-0000-000000000001",
    visitedAt: "2026-01-01",
    latitude: 35.6812,
    longitude: 139.7671,
  };

  it("更新成功時: Spot を返し、成功トーストを表示する", async () => {
    const spot = { id: "spot-1", ...validPayload };
    mockApiFetch.mockResolvedValue({ data: spot });

    const { updateSpot, loading, error } = useSpotEdit();
    const result = await updateSpot("spot-1", validPayload);

    expect(result).toEqual(spot);
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/spots/spot-1",
      expect.objectContaining({ method: "PUT" })
    );
    expect(mockToastSuccess).toHaveBeenCalledWith("スポットを更新しました");
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it("更新失敗時: null を返し、エラートーストとエラー状態を設定する", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"));

    const { updateSpot, loading, error } = useSpotEdit();
    const result = await updateSpot("spot-1", validPayload);

    expect(result).toBeNull();
    expect(mockToastError).toHaveBeenCalledWith("更新に失敗しました");
    expect(error.value).toBe("スポットの更新に失敗しました");
    expect(loading.value).toBe(false);
  });

  it("API 呼び出し中は loading が true になる", async () => {
    let resolveFn!: (v: unknown) => void;
    mockApiFetch.mockReturnValue(new Promise((r) => (resolveFn = r)));

    const { updateSpot, loading } = useSpotEdit();
    const promise = updateSpot("spot-1", validPayload);
    expect(loading.value).toBe(true);
    resolveFn({ data: { id: "spot-1" } });
    await promise;
    expect(loading.value).toBe(false);
  });
});
