import { describe, it, expect, vi, beforeEach } from "vitest";
import { flushPromises, type VueWrapper } from "@vue/test-utils";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import SpotCreateModal from "~/components/organisms/spot/SpotCreateModal.vue";
import type { Category } from "~/types/category";

const { mockApiFetch } = vi.hoisted(() => ({ mockApiFetch: vi.fn() }));

vi.mock("vue-sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

// 通信の境界（apiFetch）だけを差し替え、composable と repository は本物を通す
vi.mock("~/repositories/api-client", () => ({
  useApiClient: () => ({ apiFetch: mockApiFetch }),
}));

// createSpotSchema が categoryId に UUID を要求するため、fixture の "cat-1" ではなく UUID を使う。
// zod v4 の .uuid() はバージョン桁・バリアント桁まで検証するため、0000...0001 のような値は通らない
const CATEGORY_ID = "11111111-1111-4111-8111-111111111111";
const NEW_CATEGORY_ID = "22222222-2222-4222-8222-222222222222";

const categories: Category[] = [
  {
    id: CATEGORY_ID,
    name: "観光",
    color: "#E74C3C",
    isDefault: true,
    sortOrder: 1,
    spotCount: 0,
  },
];

/**
 * モーダルをマウントする。本体は `<Teleport to="body">` のため、スタブしてインライン描画させる。
 *
 * @param props - 既定 props（開いた状態・カテゴリ 1 件）を上書きする props
 * @returns マウント済みの wrapper
 */
function mountModal(props: Record<string, unknown> = {}) {
  return mountSuspended(SpotCreateModal, {
    props: { modelValue: true, categories, ...props },
    global: { stubs: { teleport: true } },
  });
}

/**
 * 必須項目をすべて有効な値で埋める（訪問日は既定の今日のまま）。
 *
 * @param wrapper - マウント済みの SpotCreateModal
 */
async function fillValidForm(wrapper: VueWrapper) {
  await wrapper.find('input[type="text"]').setValue("渋谷スクランブル交差点");
  await wrapper.find("select").setValue(CATEGORY_ID);
  const [lat, lng] = wrapper.findAll('input[type="number"]');
  await lat!.setValue("35.6812");
  await lng!.setValue("139.7671");
}

/**
 * 表示ラベルでボタンを取得する。
 *
 * @param wrapper - マウント済みの SpotCreateModal
 * @param label - ボタンの表示ラベル
 * @returns 一致したボタンの wrapper
 */
function findButton(wrapper: VueWrapper, label: string) {
  const button = wrapper.findAll("button").find((b) => b.text() === label);
  if (!button) throw new Error(`button "${label}" not found`);
  return button;
}

describe("SpotCreateModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- 正常系 ---

  it("N-1: 開いたとき訪問日の既定値が今日（UTC）になっている", async () => {
    const wrapper = await mountModal();

    const today = new Date().toISOString().split("T")[0];
    const date = wrapper.find('input[type="date"]');
    expect((date.element as HTMLInputElement).value).toBe(today);
    expect(date.attributes("max")).toBe(today);
  });

  it("N-2: 有効な入力で送信すると POST し、created を emit して閉じる", async () => {
    mockApiFetch.mockResolvedValue({ data: { id: "spot-1" } });
    const wrapper = await mountModal();
    await fillValidForm(wrapper);
    await wrapper.find("textarea").setValue("夜景がきれい");

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(mockApiFetch).toHaveBeenCalledWith("/api/spots", {
      method: "POST",
      body: {
        name: "渋谷スクランブル交差点",
        categoryId: CATEGORY_ID,
        visitedAt: new Date().toISOString().split("T")[0],
        latitude: 35.6812,
        longitude: 139.7671,
        memo: "夜景がきれい",
      },
    });
    expect(wrapper.emitted("created")).toHaveLength(1);
    expect(wrapper.emitted("update:modelValue")).toEqual([[false]]);
  });

  it("N-3: メモが空なら memo を送らない", async () => {
    mockApiFetch.mockResolvedValue({ data: { id: "spot-1" } });
    const wrapper = await mountModal();
    await fillValidForm(wrapper);

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    const [, options] = mockApiFetch.mock.calls[0]!;
    expect(options.body.memo).toBeUndefined();
  });

  it("N-4: インラインでカテゴリを追加すると選択肢に加わり、選択状態になる", async () => {
    mockApiFetch.mockResolvedValue({
      data: {
        id: NEW_CATEGORY_ID,
        name: "グルメ",
        color: "#3498DB",
        isDefault: false,
        sortOrder: 2,
        spotCount: 0,
      },
    });
    const wrapper = await mountModal();

    await wrapper.find("select").setValue("__new__");
    await wrapper.find('input[placeholder="カテゴリ名"]').setValue("グルメ");
    await findButton(wrapper, "追加").trigger("click");
    await flushPromises();

    const select = wrapper.find("select");
    expect((select.element as HTMLSelectElement).value).toBe(NEW_CATEGORY_ID);
    expect(select.text()).toContain("グルメ");
    expect(wrapper.find('input[placeholder="カテゴリ名"]').exists()).toBe(
      false,
    );
  });

  // --- 準正常系 ---

  it("S-1: 未入力で送信すると全項目のエラーを一度に表示し、API を呼ばない", async () => {
    const wrapper = await mountModal();

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("スポット名は必須です");
    expect(wrapper.text()).toContain("有効なカテゴリを選択してください");
    expect(wrapper.text()).toContain("緯度を入力してください");
    expect(wrapper.text()).toContain("経度を入力してください");
    expect(mockApiFetch).not.toHaveBeenCalled();
    expect(wrapper.emitted("created")).toBeUndefined();
  });

  it("S-2: 緯度・経度を入れても他が不正ならスキーマのエラーを項目ごとに表示する", async () => {
    const wrapper = await mountModal();
    const [lat, lng] = wrapper.findAll('input[type="number"]');
    await lat!.setValue("91");
    await lng!.setValue("139.7671");

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("スポット名は必須です");
    expect(wrapper.text()).toContain("有効なカテゴリを選択してください");
    expect(wrapper.text()).toContain("緯度は-90〜90の範囲で指定してください");
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it("S-3: 緯度を一度入力してから消すと「緯度を入力してください」を表示する", async () => {
    const wrapper = await mountModal();
    await fillValidForm(wrapper);
    const [lat] = wrapper.findAll('input[type="number"]');
    await lat!.setValue("");

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("緯度を入力してください");
    expect(mockApiFetch).not.toHaveBeenCalled();
  });

  it("S-4: 開き直すと入力とエラーがリセットされる", async () => {
    const wrapper = await mountModal();
    await wrapper.find('input[type="text"]').setValue("入力途中");
    await wrapper.find("form").trigger("submit");
    expect(wrapper.text()).toContain("緯度を入力してください");

    await wrapper.setProps({ modelValue: false });
    await wrapper.setProps({ modelValue: true });

    const name = wrapper.find('input[type="text"]');
    expect((name.element as HTMLInputElement).value).toBe("");
    expect(wrapper.text()).not.toContain("緯度を入力してください");
  });

  it("S-5: インライン追加でカテゴリ名が空なら API を呼ばずにエラーを表示する", async () => {
    const wrapper = await mountModal();

    await wrapper.find("select").setValue("__new__");
    await findButton(wrapper, "追加").trigger("click");
    await flushPromises();

    expect(mockApiFetch).not.toHaveBeenCalled();
    expect(wrapper.find('input[placeholder="カテゴリ名"]').exists()).toBe(true);
    expect(wrapper.find("p.text-xs.text-red-500").exists()).toBe(true);
  });

  it("S-6: 閉じている（modelValue=false）ときは何も描画しない", async () => {
    const wrapper = await mountModal({ modelValue: false });

    expect(wrapper.find("form").exists()).toBe(false);
  });

  // --- 異常系 ---

  it("A-1: 登録 API が失敗したらエラーを表示し、閉じない", async () => {
    mockApiFetch.mockRejectedValue(new Error("Network error"));
    const wrapper = await mountModal();
    await fillValidForm(wrapper);

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(wrapper.text()).toContain("スポットの登録に失敗しました");
    expect(wrapper.emitted("created")).toBeUndefined();
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });
});
