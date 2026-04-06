import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockApiFetch } = vi.hoisted(() => ({
  mockApiFetch: vi.fn(),
}));

vi.mock("~/composables/useApiClient", () => ({
  useApiClient: () => ({ apiFetch: mockApiFetch }),
}));

describe("useIsOwner", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("N-1: API が isOwner: true を返したとき、isOwner が true になる", async () => {
    mockApiFetch.mockResolvedValue({ data: { isOwner: true } });

    const { isOwner, fetchIsOwner } = useIsOwner();
    await fetchIsOwner();

    expect(isOwner.value).toBe(true);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/me/is-owner");
  });

  it("N-2: API が isOwner: false を返したとき、isOwner が false になる", async () => {
    mockApiFetch.mockResolvedValue({ data: { isOwner: false } });

    const { isOwner, fetchIsOwner } = useIsOwner();
    await fetchIsOwner();

    expect(isOwner.value).toBe(false);
  });

  it("A-1: API がエラーを throw したとき、isOwner が false のまま（フェイルセーフ）", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"));

    const { isOwner, fetchIsOwner } = useIsOwner();
    await fetchIsOwner();

    expect(isOwner.value).toBe(false);
  });

  it("A-2: fetchIsOwner 呼び出し前に isOwner を false にリセットする", async () => {
    // 1回目: true を返す
    mockApiFetch.mockResolvedValueOnce({ data: { isOwner: true } });

    const { isOwner, fetchIsOwner } = useIsOwner();
    await fetchIsOwner();
    expect(isOwner.value).toBe(true);

    // 2回目: API エラー → リセットされて false になる
    mockApiFetch.mockRejectedValueOnce(new Error("Unauthorized"));
    await fetchIsOwner();
    expect(isOwner.value).toBe(false);
  });
});
