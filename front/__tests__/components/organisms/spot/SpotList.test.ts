import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import SpotList from "~/components/organisms/spot/SpotList.vue";
import { buildSpot } from "../../../fixtures/spot";

const spots = [
  buildSpot({ id: "spot-1", name: "東京タワー" }),
  buildSpot({ id: "spot-2", name: "浅草寺" }),
];

describe("SpotList", () => {
  // --- 正常系 ---

  it("N-1: スポットを一覧（SpotListItem）として表示する", async () => {
    const wrapper = await mountSuspended(SpotList, {
      props: { spots, loading: false, error: null },
    });

    const items = wrapper.findAll("li");
    expect(items).toHaveLength(2);
    expect(items[0]!.text()).toContain("東京タワー");
    expect(items[1]!.text()).toContain("浅草寺");
  });

  it("N-2: 項目のクリックを select として親へ中継する", async () => {
    const wrapper = await mountSuspended(SpotList, {
      props: { spots, loading: false, error: null },
    });

    await wrapper.findAll("li")[1]!.trigger("click");

    expect(wrapper.emitted("select")).toEqual([[spots[1]]]);
  });

  it("N-3: selectedSpotId に一致する項目だけハイライトする", async () => {
    const wrapper = await mountSuspended(SpotList, {
      props: { spots, loading: false, error: null, selectedSpotId: "spot-2" },
    });

    const items = wrapper.findAll("li");
    expect(items[0]!.classes()).not.toContain("ring-2");
    expect(items[1]!.classes()).toContain("ring-2");
  });

  // --- 準正常系（表示状態の優先順位: loading → error → 空 → 一覧） ---

  it("S-1: 0 件なら空状態のメッセージを表示する", async () => {
    const wrapper = await mountSuspended(SpotList, {
      props: { spots: [], loading: false, error: null },
    });

    expect(wrapper.text()).toContain("スポットが見つかりませんでした");
    expect(wrapper.find("ul").exists()).toBe(false);
  });

  it("S-2: 取得エラーがあればエラーメッセージを表示し、一覧は描画しない", async () => {
    const wrapper = await mountSuspended(SpotList, {
      props: { spots, loading: false, error: "スポットの取得に失敗しました" },
    });

    expect(wrapper.text()).toContain("スポットの取得に失敗しました");
    expect(wrapper.find("li").exists()).toBe(false);
  });

  it("S-3: エラーかつ 0 件のときは空状態ではなくエラーを表示する", async () => {
    const wrapper = await mountSuspended(SpotList, {
      props: {
        spots: [],
        loading: false,
        error: "スポットの取得に失敗しました",
      },
    });

    expect(wrapper.text()).toContain("スポットの取得に失敗しました");
    expect(wrapper.text()).not.toContain("スポットが見つかりませんでした");
  });

  it("S-4: 取得中はエラー・一覧より優先してスケルトンを表示する", async () => {
    const wrapper = await mountSuspended(SpotList, {
      props: { spots, loading: true, error: "スポットの取得に失敗しました" },
    });

    expect(wrapper.findAll(".animate-pulse")).toHaveLength(5);
    expect(wrapper.text()).not.toContain("スポットの取得に失敗しました");
    expect(wrapper.find("li").exists()).toBe(false);
  });
});
