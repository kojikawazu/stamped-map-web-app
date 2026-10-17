import { describe, it, expect } from "vitest";
import type { VueWrapper } from "@vue/test-utils";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import SpotPagination from "~/components/molecules/spot/SpotPagination.vue";
import { buildPagination } from "../../../fixtures/spot";

/**
 * 「前へ」「次へ」ボタンを取得する。ボタンに識別子が無いため表示ラベルで引く。
 *
 * @param wrapper - マウント済みの SpotPagination
 * @returns 「前へ」「次へ」ボタンの wrapper
 */
function findButtons(wrapper: VueWrapper) {
  const buttons = wrapper.findAll("button");
  const prev = buttons.find((b) => b.text() === "前へ");
  const next = buttons.find((b) => b.text() === "次へ");
  if (!prev || !next) throw new Error("pagination buttons not found");
  return { prev, next };
}

describe("SpotPagination", () => {
  // --- 正常系 ---

  it("N-1: 総件数と「現在ページ / 総ページ数」を表示する", async () => {
    const wrapper = await mountSuspended(SpotPagination, {
      props: { pagination: buildPagination(), currentPage: 2 },
    });

    expect(wrapper.text()).toContain("100件");
    expect(wrapper.text()).toContain("2 / 5");
  });

  it("N-2: 「次へ」で現在ページ + 1 を update:page として emit する", async () => {
    const wrapper = await mountSuspended(SpotPagination, {
      props: { pagination: buildPagination(), currentPage: 2 },
    });

    await findButtons(wrapper).next.trigger("click");

    expect(wrapper.emitted("update:page")).toEqual([[3]]);
  });

  it("N-3: 「前へ」で現在ページ - 1 を update:page として emit する", async () => {
    const wrapper = await mountSuspended(SpotPagination, {
      props: { pagination: buildPagination(), currentPage: 2 },
    });

    await findButtons(wrapper).prev.trigger("click");

    expect(wrapper.emitted("update:page")).toEqual([[1]]);
  });

  // --- 準正常系 ---

  it("S-1: ページング情報が未取得（null）なら何も描画しない", async () => {
    const wrapper = await mountSuspended(SpotPagination, {
      props: { pagination: null, currentPage: 1 },
    });

    expect(wrapper.find("button").exists()).toBe(false);
  });

  it("S-2: 総ページ数が 1 ならコントロールを描画しない", async () => {
    const wrapper = await mountSuspended(SpotPagination, {
      props: {
        pagination: buildPagination({ total: 3, totalPages: 1 }),
        currentPage: 1,
      },
    });

    expect(wrapper.find("button").exists()).toBe(false);
  });

  it("S-3: 先頭ページでは「前へ」が無効で、押しても emit しない", async () => {
    const wrapper = await mountSuspended(SpotPagination, {
      props: { pagination: buildPagination(), currentPage: 1 },
    });
    const { prev, next } = findButtons(wrapper);

    expect(prev.attributes("disabled")).toBeDefined();
    expect(next.attributes("disabled")).toBeUndefined();
    await prev.trigger("click");
    expect(wrapper.emitted("update:page")).toBeUndefined();
  });

  it("S-4: 最終ページでは「次へ」が無効で、押しても emit しない", async () => {
    const wrapper = await mountSuspended(SpotPagination, {
      props: { pagination: buildPagination(), currentPage: 5 },
    });
    const { prev, next } = findButtons(wrapper);

    expect(next.attributes("disabled")).toBeDefined();
    expect(prev.attributes("disabled")).toBeUndefined();
    await next.trigger("click");
    expect(wrapper.emitted("update:page")).toBeUndefined();
  });
});
