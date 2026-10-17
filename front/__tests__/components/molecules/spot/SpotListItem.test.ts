import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import SpotListItem from "~/components/molecules/spot/SpotListItem.vue";
import { buildSpot } from "../../../fixtures/spot";

describe("SpotListItem", () => {
  // --- 正常系 ---

  it("N-1: スポット名・カテゴリ名・訪問日（YYYY/MM/DD）を表示する", async () => {
    const wrapper = await mountSuspended(SpotListItem, {
      props: { spot: buildSpot() },
    });

    expect(wrapper.text()).toContain("東京タワー");
    expect(wrapper.text()).toContain("観光");
    expect(wrapper.text()).toContain("2026/01/02");
  });

  it("N-2: クリックするとスポットを select として emit する", async () => {
    const spot = buildSpot();
    const wrapper = await mountSuspended(SpotListItem, { props: { spot } });

    await wrapper.find("li").trigger("click");

    expect(wrapper.emitted("select")).toEqual([[spot]]);
  });

  it("N-3: カテゴリ色を左ボーダーとバッジに反映する", async () => {
    const wrapper = await mountSuspended(SpotListItem, {
      props: {
        spot: buildSpot({
          category: { id: "cat-2", name: "グルメ", color: "#3498DB" },
        }),
      },
    });

    // 要素を特定して検証する。HTML 全体への正規表現だと、バッジの `color:` が
    // 左ボーダーの `background-color:` にも一致し、バッジ色が壊れても通ってしまう。
    const spans = wrapper.findAll("span");
    const border = spans[0]!;
    const badge = spans.find((s) => s.text() === "グルメ")!;
    // 左ボーダーは色そのもの
    expect(border.element.style.backgroundColor).toBe("#3498DB");
    // バッジは文字色が色そのもの、背景は色 + 透明度 "22"（約 13%）
    expect(badge.element.style.color).toBe("#3498DB");
    expect(badge.element.style.backgroundColor).toBe("#3498DB22");
  });

  it("N-4: selected のときハイライト（ring）を付ける", async () => {
    const wrapper = await mountSuspended(SpotListItem, {
      props: { spot: buildSpot(), selected: true },
    });

    expect(wrapper.find("li").classes()).toContain("ring-2");
  });

  // --- 準正常系 ---

  it("S-1: selected 未指定（既定 false）ならハイライトしない", async () => {
    const wrapper = await mountSuspended(SpotListItem, {
      props: { spot: buildSpot() },
    });

    expect(wrapper.find("li").classes()).not.toContain("ring-2");
  });
});
