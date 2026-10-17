import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises, type VueWrapper } from "@vue/test-utils";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import SpotEditModal from "~/components/organisms/spot/SpotEditModal.vue";
import type { Category } from "~/types/category";
import { buildSpot } from "../../../fixtures/spot";

const { mockApiFetch } = vi.hoisted(() => ({ mockApiFetch: vi.fn() }));

vi.mock("vue-sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// 通信の境界（apiFetch）だけを差し替え、composable と repository は本物を通す
vi.mock("~/repositories/api-client", () => ({
  useApiClient: () => ({ apiFetch: mockApiFetch }),
}));

// updateSpotSchema が categoryId に UUID を要求するため、fixture の "cat-1" ではなく UUID を使う。
// zod v4 の .uuid() はバージョン桁・バリアント桁まで検証するため、0000...0001 のような値は通らない
const CATEGORY_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_CATEGORY_ID = "22222222-2222-4222-8222-222222222222";

const categories: Category[] = [
  {
    id: CATEGORY_ID,
    name: "観光",
    color: "#E74C3C",
    isDefault: true,
    sortOrder: 1,
    spotCount: 1,
  },
  {
    id: OTHER_CATEGORY_ID,
    name: "グルメ",
    color: "#3498DB",
    isDefault: false,
    sortOrder: 2,
    spotCount: 0,
  },
];

const spot = buildSpot({
  category: { id: CATEGORY_ID, name: "観光", color: "#E74C3C" },
  memo: "展望台に登った",
});

/**
 * モーダルをマウントする。本体は `<Teleport to="body">` のため、スタブしてインライン描画させる。
 *
 * @param props - 既定 props（開いた状態・編集対象 spot・カテゴリ 2 件）を上書きする props
 * @returns マウント済みの wrapper
 */
function mountModal(props: Record<string, unknown> = {}) {
  return mountSuspended(SpotEditModal, {
    props: { modelValue: true, spot, categories, ...props },
    global: { stubs: { teleport: true } },
  });
}

/**
 * 入力要素の現在値を読む。
 *
 * @param wrapper - マウント済みの SpotEditModal
 * @param selector - 対象要素のセレクタ
 * @returns 要素の `value`
 */
function valueOf(wrapper: VueWrapper, selector: string) {
  return (wrapper.find(selector).element as HTMLInputElement).value;
}

describe("SpotEditModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- 正常系 ---

  it("N-1: 編集対象のスポットの値でフォームを初期化する", async () => {
    const wrapper = await mountModal();
    const [lat, lng] = wrapper.findAll('input[type="number"]');

    expect(valueOf(wrapper, 'input[type="text"]')).toBe("東京タワー");
    expect(valueOf(wrapper, "select")).toBe(CATEGORY_ID);
    expect(valueOf(wrapper, 'input[type="date"]')).toBe("2026-01-02");
    expect((lat!.element as HTMLInputElement).value).toBe("35.6586");
    expect((lng!.element as HTMLInputElement).value).toBe("139.7454");
    expect(valueOf(wrapper, "textarea")).toBe("展望台に登った");
  });

  it("N-2: 送信すると PUT し、updated を更新後のスポットで emit して閉じる", async () => {
    const updated = buildSpot({ name: "東京スカイツリー" });
    mockApiFetch.mockResolvedValue({ data: updated });
    const wrapper = await mountModal();
    await wrapper.find('input[type="text"]').setValue("東京スカイツリー");
    await wrapper.find("select").setValue(OTHER_CATEGORY_ID);

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(mockApiFetch).toHaveBeenCalledWith("/api/spots/spot-1", {
      method: "PUT",
      body: {
        name: "東京スカイツリー",
        categoryId: OTHER_CATEGORY_ID,
        visitedAt: "2026-01-02",
        latitude: 35.6586,
        longitude: 139.7454,
        memo: "展望台に登った",
      },
    });
    expect(wrapper.emitted("updated")).toEqual([[updated]]);
    expect(wrapper.emitted("update:modelValue")).toEqual([[false]]);
  });

  it("N-3: メモを空にすると memo を送らない", async () => {
    mockApiFetch.mockResolvedValue({ data: spot });
    const wrapper = await mountModal();
    await wrapper.find("textarea").setValue("");

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    const [, options] = mockApiFetch.mock.calls[0]!;
    expect(options.body.memo).toBeUndefined();
  });

  // --- 準正常系 ---

  it("S-1: スポット名を空にして送信するとエラーを表示し、API を呼ばない", async () => {
    const wrapper = await mountModal();
    await wrapper.find('input[type="text"]').setValue("");

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("スポット名は必須です");
    expect(mockApiFetch).not.toHaveBeenCalled();
    expect(wrapper.emitted("updated")).toBeUndefined();
  });

  it("S-2: 緯度を消して送信すると「緯度を入力してください」を表示する", async () => {
    const wrapper = await mountModal();
    const [lat] = wrapper.findAll('input[type="number"]');
    await lat!.setValue("");

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("緯度を入力してください");
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it("S-3: 編集対象が切り替わるとフォームとエラーを再初期化する", async () => {
    const wrapper = await mountModal();
    await wrapper.find('input[type="text"]').setValue("");
    await wrapper.find("form").trigger("submit");
    expect(wrapper.text()).toContain("スポット名は必須です");

    await wrapper.setProps({
      spot: buildSpot({
        id: "spot-2",
        name: "浅草寺",
        category: { id: OTHER_CATEGORY_ID, name: "グルメ", color: "#3498DB" },
        memo: null,
      }),
    });

    expect(valueOf(wrapper, 'input[type="text"]')).toBe("浅草寺");
    expect(valueOf(wrapper, "select")).toBe(OTHER_CATEGORY_ID);
    expect(valueOf(wrapper, "textarea")).toBe("");
    expect(wrapper.text()).not.toContain("スポット名は必須です");
  });

  it("S-4: 編集対象が未選択（null）なら開いていても何も描画しない", async () => {
    const wrapper = await mountModal({ spot: null });

    expect(wrapper.find("form").exists()).toBe(false);
  });

  // --- 異常系 ---

  it("A-1: 更新 API が失敗したらエラーを表示し、閉じない", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"));
    const wrapper = await mountModal();

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("スポットの更新に失敗しました");
    expect(wrapper.emitted("updated")).toBeUndefined();
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });
});
