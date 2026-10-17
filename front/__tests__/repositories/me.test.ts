import { describe, it, expect, vi, beforeEach } from "vitest";
import { useMeRepository } from "../../repositories/me";

// 外部境界（認証付き $fetch）だけを差し替え、envelope の展開は本物を通す
const { mockApiFetch } = vi.hoisted(() => ({ mockApiFetch: vi.fn() }));

vi.mock("~/repositories/api-client", () => ({
  useApiClient: () => ({ apiFetch: mockApiFetch }),
}));

describe("useMeRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- 正常系 ---

  it("N-1: isOwner はオーナー判定 API を GET し、真偽値を返す", async () => {
    mockApiFetch.mockResolvedValue({ data: { isOwner: true } });

    await expect(useMeRepository().isOwner()).resolves.toBe(true);
    expect(mockApiFetch).toHaveBeenCalledWith("/api/me/is-owner");
  });

  // --- 準正常系 ---

  it("S-1: 非オーナーなら false を返す", async () => {
    mockApiFetch.mockResolvedValue({ data: { isOwner: false } });

    await expect(useMeRepository().isOwner()).resolves.toBe(false);
  });

  // --- 異常系 ---

  it("A-1: 未認証（401）などの API エラーはそのまま投げる", async () => {
    mockApiFetch.mockRejectedValue(new Error("401"));

    await expect(useMeRepository().isOwner()).rejects.toThrow("401");
  });
});
