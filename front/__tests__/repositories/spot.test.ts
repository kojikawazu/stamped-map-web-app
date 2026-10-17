import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSpotRepository } from "../../repositories/spot";

// 外部境界（認証付き $fetch）だけを差し替え、URL 組み立て・envelope の展開は本物を通す
const { mockApiFetch } = vi.hoisted(() => ({ mockApiFetch: vi.fn() }));

vi.mock("~/repositories/api-client", () => ({
  useApiClient: () => ({ apiFetch: mockApiFetch }),
}));

describe("useSpotRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const input = {
    name: "東京タワー",
    categoryId: "00000000-0000-0000-0000-000000000001",
    visitedAt: "2026-01-01",
    latitude: 35.6586,
    longitude: 139.7454,
  };
  const spot = { id: "spot-1", ...input };

  // --- 正常系 ---

  it("N-1: list はクエリを文字列化して GET し、レスポンスをそのまま返す", async () => {
    const res = { data: [spot], pagination: { page: 1 } };
    mockApiFetch.mockResolvedValue(res);

    const result = await useSpotRepository().list({
      page: 2,
      limit: 20,
      q: "タワー",
    });

    expect(result).toEqual(res);
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/spots?page=2&limit=20&q=%E3%82%BF%E3%83%AF%E3%83%BC",
    );
  });

  it("N-2: listMarkers は条件付きで GET し、data を展開して返す", async () => {
    const markers = [{ id: "spot-1" }];
    mockApiFetch.mockResolvedValue({ data: markers });

    const result = await useSpotRepository().listMarkers({ category: "a,b" });

    expect(result).toEqual(markers);
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/spots/markers?category=a%2Cb",
    );
  });

  it("N-3: create は POST し、data を展開して返す", async () => {
    mockApiFetch.mockResolvedValue({ data: spot });

    const result = await useSpotRepository().create(input);

    expect(result).toEqual(spot);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/spots", {
      method: "POST",
      body: input,
    });
  });

  it("N-4: update は対象 ID へ PUT し、data を展開して返す", async () => {
    mockApiFetch.mockResolvedValue({ data: spot });

    const result = await useSpotRepository().update("spot-1", input);

    expect(result).toEqual(spot);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/spots/spot-1", {
      method: "PUT",
      body: input,
    });
  });

  it("N-5: remove は対象 ID へ DELETE する", async () => {
    mockApiFetch.mockResolvedValue({ data: { id: "spot-1" } });

    await expect(useSpotRepository().remove("spot-1")).resolves.toBeUndefined();
    expect(mockApiFetch).toHaveBeenCalledWith("/api/spots/spot-1", {
      method: "DELETE",
    });
  });

  // --- 準正常系 ---

  it("S-1: listMarkers は条件が空なら ? を付けずに GET する", async () => {
    mockApiFetch.mockResolvedValue({ data: [] });

    await useSpotRepository().listMarkers({});

    expect(mockApiFetch).toHaveBeenCalledWith("/api/spots/markers");
  });

  // --- 異常系 ---

  it("A-1: API エラーは握りつぶさずそのまま投げる", async () => {
    mockApiFetch.mockRejectedValue(new Error("500"));

    await expect(useSpotRepository().create(input)).rejects.toThrow("500");
  });
});
