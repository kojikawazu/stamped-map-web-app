import { describe, it, expect } from "vitest";
import { mountSuspended } from "@nuxt/test-utils/runtime";
import ConfirmDialog from "~/components/molecules/common/ConfirmDialog.vue";

const baseProps = {
  modelValue: true,
  title: "スポットを削除",
  message: "この操作は取り消せません",
};

/**
 * ダイアログをマウントする。
 *
 * 本体は `<Teleport to="body">` で描画されるため、そのままでは wrapper の外（document.body）に出て
 * `wrapper.find` で取れない。Teleport をスタブしてインラインに描画させ、wrapper 内で検証する。
 *
 * @param props - baseProps を上書きする props
 * @returns マウント済みの wrapper
 */
function mountDialog(props: Record<string, unknown> = {}) {
  return mountSuspended(ConfirmDialog, {
    props: { ...baseProps, ...props },
    global: { stubs: { teleport: true } },
  });
}

/**
 * 表示ラベルでボタンを取得する。ボタンに識別子が無いため表示ラベルで引く。
 *
 * @param wrapper - マウント済みの ConfirmDialog
 * @param label - ボタンの表示ラベル
 * @returns 一致したボタンの wrapper
 */
function findButton(
  wrapper: Awaited<ReturnType<typeof mountDialog>>,
  label: string,
) {
  const button = wrapper.findAll("button").find((b) => b.text() === label);
  if (!button) throw new Error(`button "${label}" not found`);
  return button;
}

describe("ConfirmDialog", () => {
  // --- 正常系 ---

  it("N-1: 開いているとき見出し・本文・既定ラベル（確認 / キャンセル）を表示する", async () => {
    const wrapper = await mountDialog();

    expect(wrapper.text()).toContain("スポットを削除");
    expect(wrapper.text()).toContain("この操作は取り消せません");
    expect(findButton(wrapper, "確認").exists()).toBe(true);
    expect(findButton(wrapper, "キャンセル").exists()).toBe(true);
  });

  it("N-2: confirmLabel を指定すると実行ボタンのラベルが変わる", async () => {
    const wrapper = await mountDialog({ confirmLabel: "削除する" });

    expect(findButton(wrapper, "削除する").exists()).toBe(true);
  });

  it("N-3: 実行ボタンで confirm を emit し、閉じる通知はしない", async () => {
    const wrapper = await mountDialog();

    await findButton(wrapper, "確認").trigger("click");

    expect(wrapper.emitted("confirm")).toHaveLength(1);
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();
  });

  it("N-4: キャンセルで update:modelValue(false) を emit する", async () => {
    const wrapper = await mountDialog();

    await findButton(wrapper, "キャンセル").trigger("click");

    expect(wrapper.emitted("update:modelValue")).toEqual([[false]]);
    expect(wrapper.emitted("confirm")).toBeUndefined();
  });

  it("N-5: 背景（オーバーレイ）のクリックで閉じ、ダイアログ内のクリックでは閉じない", async () => {
    const wrapper = await mountDialog();

    await wrapper.find("h2").trigger("click");
    expect(wrapper.emitted("update:modelValue")).toBeUndefined();

    // @click.self のため、オーバーレイ要素そのものをクリックしたときだけ閉じる
    await wrapper.find(".fixed.inset-0").trigger("click");
    expect(wrapper.emitted("update:modelValue")).toEqual([[false]]);
  });

  // --- 準正常系 ---

  it("S-1: 閉じている（modelValue=false）ときは何も描画しない", async () => {
    const wrapper = await mountDialog({ modelValue: false });

    expect(wrapper.find("button").exists()).toBe(false);
    expect(wrapper.text()).not.toContain("スポットを削除");
  });

  it("S-2: 実行中（loading）は両ボタンを無効化し、loadingLabel を表示する", async () => {
    const wrapper = await mountDialog({
      loading: true,
      loadingLabel: "削除中...",
    });

    const confirm = findButton(wrapper, "削除中...");
    const cancel = findButton(wrapper, "キャンセル");
    expect(confirm.attributes("disabled")).toBeDefined();
    expect(cancel.attributes("disabled")).toBeDefined();

    // 二重実行を防ぐ: 無効化中は押しても emit されない
    await confirm.trigger("click");
    expect(wrapper.emitted("confirm")).toBeUndefined();
  });

  it("S-3: loadingLabel 未指定の実行中は既定ラベル（処理中...）を表示する", async () => {
    const wrapper = await mountDialog({ loading: true });

    expect(findButton(wrapper, "処理中...").exists()).toBe(true);
  });
});
