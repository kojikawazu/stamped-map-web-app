import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { effectScope, type EffectScope } from "vue";
import { clearNuxtState } from "#imports";
import { useSpots } from "../../composables/useSpots";
import { useSpotFilter } from "../../composables/useSpotFilter";
import { buildPagination, buildSpot } from "../fixtures/spot";

const { mockApiFetch } = vi.hoisted(() => ({ mockApiFetch: vi.fn() }));

vi.mock("~/repositories/api-client", () => ({
  useApiClient: () => ({ apiFetch: mockApiFetch }),
}));

describe("useSpots", () => {
  // useSpots は内部で watch を張る。コンポーネント外で呼ぶと watch が破棄されずテスト間に残り、
  // 後続テストのフィルタ変更で前のテストのインスタンスまで再取得してしまう。
  // effectScope 内で生成し、afterEach で stop して watch ごと破棄する。
  let scope: EffectScope;

  function setup() {
    scope = effectScope();
    return scope.run(() => useSpots())!;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    // 一覧・ページングは useState（"spots:*"）で共有されるため、前のテストの結果を消す
    clearNuxtState(["spots:list", "spots:pagination"]);
    useSpotFilter().resetFilters();
  });

  afterEach(() => {
    scope?.stop();
  });

  // --- 正常系 ---

  it("N-1: 取得成功時に一覧とページング情報を反映し、エラーは null のまま", async () => {
    const spots = [buildSpot()];
    const pagination = buildPagination({ total: 1, totalPages: 1 });
    // API は { data, pagination } の envelope で返す（server/api/spots/index.get.ts）
    mockApiFetch.mockResolvedValueOnce({ data: spots, pagination });
    const {
      spots: list,
      pagination: page,
      loading,
      error,
      fetchSpots,
    } = setup();

    await fetchSpots();

    expect(list.value).toEqual(spots);
    expect(page.value).toEqual(pagination);
    expect(loading.value).toBe(false);
    expect(error.value).toBeNull();
  });

  it("N-2: 現在の絞り込み条件（spotsQuery）をクエリとして一覧 API を呼ぶ", async () => {
    mockApiFetch.mockResolvedValueOnce({
      data: [],
      pagination: buildPagination(),
    });
    const { fetchSpots } = setup();

    await fetchSpots();

    const url = mockApiFetch.mock.calls[0]![0] as string;
    expect(url).toMatch(/^\/api\/spots\?/);
    expect(url).toContain("page=1");
    expect(url).toContain("sort=visited_at");
  });

  it("N-3: 絞り込み条件が変わると自動で再取得する", async () => {
    mockApiFetch.mockResolvedValue({ data: [], pagination: buildPagination() });
    setup();

    useSpotFilter().setSearch("タワー");

    await vi.waitFor(() => expect(mockApiFetch).toHaveBeenCalledTimes(1));
    expect(mockApiFetch.mock.calls[0]![0]).toContain("q=");
  });

  // --- 準正常系 ---

  it("S-1: 取得中は loading が true になり、完了後に false へ戻る", async () => {
    let resolve!: (value: unknown) => void;
    mockApiFetch.mockReturnValueOnce(new Promise((r) => (resolve = r)));
    const { loading, fetchSpots } = setup();

    const pending = fetchSpots();
    expect(loading.value).toBe(true);

    resolve({ data: [], pagination: buildPagination() });
    await pending;
    expect(loading.value).toBe(false);
  });

  it("S-2: 失敗後に再取得が成功するとエラーが解除される", async () => {
    mockApiFetch
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ data: [], pagination: buildPagination() });
    const { error, fetchSpots } = setup();

    await fetchSpots();
    expect(error.value).not.toBeNull();

    await fetchSpots();
    expect(error.value).toBeNull();
  });

  // --- 異常系 ---

  it("A-1: 取得失敗時にエラーメッセージを設定し、loading を false に戻す", async () => {
    mockApiFetch.mockRejectedValueOnce(new Error("500 Internal Server Error"));
    const { error, loading, fetchSpots } = setup();

    await fetchSpots();

    expect(error.value).toBe("スポットの取得に失敗しました");
    expect(loading.value).toBe(false);
  });
});
