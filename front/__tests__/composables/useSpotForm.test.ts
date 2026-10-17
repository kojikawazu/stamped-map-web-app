import { describe, it, expect } from "vitest";
import { createSpotSchema } from "~/schemas/spot";

// createSpotSchema が categoryId に UUID を要求する。zod v4 の .uuid() はバージョン桁・バリアント桁まで検証する
const CATEGORY_ID = "11111111-1111-4111-8111-111111111111";

const validValues = {
  name: "東京タワー",
  categoryId: CATEGORY_ID,
  visitedAt: "2026-01-02",
  latitude: 35.6586,
  longitude: 139.7454,
  memo: "展望台に登った",
};

describe("useSpotForm", () => {
  // --- 正常系 ---

  it("N-1: 初期状態は全項目が未入力で、訪問日だけ今日（UTC）になっている", () => {
    const { form, errors, todayStr } = useSpotForm(createSpotSchema);

    expect(todayStr).toBe(new Date().toISOString().split("T")[0]);
    expect({ ...form }).toEqual({
      name: "",
      categoryId: "",
      visitedAt: todayStr,
      latitude: undefined,
      longitude: undefined,
      memo: "",
    });
    expect(errors.value).toEqual({});
  });

  it("N-2: 有効な入力なら検証済みの値を返し、エラーは空になる", () => {
    const { form, errors, reset, validate } = useSpotForm(createSpotSchema);
    reset(validValues);

    expect(validate()).toEqual(validValues);
    expect(errors.value).toEqual({});
    // reactive の form 自体は書き換えない
    expect(form.name).toBe("東京タワー");
  });

  it("N-3: メモが空文字なら memo を undefined にして返す", () => {
    const { reset, validate } = useSpotForm(createSpotSchema);
    reset({ ...validValues, memo: "" });

    expect(validate()?.memo).toBeUndefined();
  });

  it("N-4: reset は渡した値を初期値に重ね、エラーを消す", () => {
    const { form, errors, reset, validate } = useSpotForm(createSpotSchema);
    validate();
    expect(errors.value.name).toBeDefined();

    reset({ name: "浅草寺" });

    expect(form.name).toBe("浅草寺");
    expect(form.categoryId).toBe("");
    expect(errors.value).toEqual({});
  });

  it("N-5: reset を引数なしで呼ぶと、入力済みの値を空に戻す", () => {
    const { form, todayStr, reset } = useSpotForm(createSpotSchema);
    reset(validValues);

    reset();

    expect(form.name).toBe("");
    expect(form.latitude).toBeUndefined();
    expect(form.visitedAt).toBe(todayStr);
  });

  // --- 準正常系 ---

  it("S-1: 未入力なら null を返し、全項目のエラーを一度に設定する", () => {
    const { errors, validate } = useSpotForm(createSpotSchema);

    expect(validate()).toBeNull();
    expect(errors.value).toEqual({
      name: "スポット名は必須です",
      categoryId: "有効なカテゴリを選択してください",
      latitude: "緯度を入力してください",
      longitude: "経度を入力してください",
    });
  });

  it.each([
    ["空文字（v-model.number が空欄を書き戻した値）", ""],
    ["NaN", Number.NaN],
    ["undefined", undefined],
  ])(
    "S-2: 緯度・経度が %s なら「入力してください」を表示する（スキーマの型エラーにしない）",
    (_, value) => {
      const { errors, reset, validate } = useSpotForm(createSpotSchema);
      reset({ ...validValues, latitude: value, longitude: value });

      expect(validate()).toBeNull();
      expect(errors.value).toEqual({
        latitude: "緯度を入力してください",
        longitude: "経度を入力してください",
      });
    },
  );

  it("S-3: 範囲外の緯度・経度はスキーマのメッセージを表示する", () => {
    const { errors, reset, validate } = useSpotForm(createSpotSchema);
    reset({ ...validValues, latitude: 91, longitude: -181 });

    expect(validate()).toBeNull();
    expect(errors.value).toEqual({
      latitude: "緯度は-90〜90の範囲で指定してください",
      longitude: "経度は-180〜180の範囲で指定してください",
    });
  });

  it("S-4: 1 項目に複数のエラーがあっても最初の 1 件だけを表示する", () => {
    const { errors, reset, validate } = useSpotForm(createSpotSchema);
    // 存在しない日付かつ未来日。refine が 2 つとも失敗する
    reset({ ...validValues, visitedAt: "9999-13-45" });

    expect(validate()).toBeNull();
    expect(errors.value).toEqual({ visitedAt: "存在しない日付です" });
  });

  it("S-5: 誤りを直して再検証すると、前回のエラーが残らない", () => {
    const { form, errors, reset, validate } = useSpotForm(createSpotSchema);
    reset({ ...validValues, name: "" });
    validate();
    expect(errors.value).toEqual({ name: "スポット名は必須です" });

    form.name = "東京タワー";

    expect(validate()).not.toBeNull();
    expect(errors.value).toEqual({});
  });
});
