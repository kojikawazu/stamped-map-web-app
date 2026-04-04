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

describe("useSpotCreate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validPayload = {
    name: "渋谷スクランブル交差点",
    categoryId: "00000000-0000-0000-0000-000000000001",
    visitedAt: "2026-01-01",
    latitude: 35.6812,
    longitude: 139.7671,
  };

  it("登録成功時: Spot を返し、成功トーストを表示する", async () => {
    const spot = { id: "spot-1", ...validPayload };
    mockApiFetch.mockResolvedValue(spot);

    const { createSpot, loading, error } = useSpotCreate();
    const result = await createSpot(validPayload);

    expect(result).toEqual(spot);
    expect(mockToastSuccess).toHaveBeenCalledWith("スポットを登録しました");
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it("登録失敗時: null を返し、エラートーストとエラー状態を設定する", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"));

    const { createSpot, loading, error } = useSpotCreate();
    const result = await createSpot(validPayload);

    expect(result).toBeNull();
    expect(mockToastError).toHaveBeenCalledWith("登録に失敗しました");
    expect(error.value).toBe("スポットの登録に失敗しました");
    expect(loading.value).toBe(false);
  });

  it("API 呼び出し中は loading が true になる", async () => {
    let resolveFn!: (v: unknown) => void;
    mockApiFetch.mockReturnValue(new Promise((r) => (resolveFn = r)));

    const { createSpot, loading } = useSpotCreate();
    const promise = createSpot(validPayload);
    expect(loading.value).toBe(true);
    resolveFn({ id: "spot-1" });
    await promise;
    expect(loading.value).toBe(false);
  });
});
