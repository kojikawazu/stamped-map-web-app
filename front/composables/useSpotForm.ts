import type { CreateSpotInput, createSpotSchema } from "~/schemas/spot";

/** スポット登録・編集フォームの入力値 */
type SpotFormValues = {
  /** スポット名 */
  name: string;
  /** 選択中のカテゴリ ID。未選択は空文字 */
  categoryId: string;
  /** 訪問日（`YYYY-MM-DD`）。`<input type="date">` の値 */
  visitedAt: string;
  /**
   * 緯度。未入力は `undefined`。
   * `v-model.number` は数値に変換できない入力（空欄など）を文字列のまま書き戻すため、実行時は文字列も入り得る
   */
  latitude: number | string | undefined;
  /** 経度。未入力・文字列の扱いは `latitude` と同じ */
  longitude: number | string | undefined;
  /** メモ。未入力は空文字（送信時に `undefined` へ変換する） */
  memo: string;
};

/** 入力項目ごとのエラーメッセージ。エラーの無い項目はキー自体を持たない */
type SpotFormErrors = Partial<Record<keyof SpotFormValues, string>>;

/**
 * zod の issue パスがフォームの入力項目を指しているかを判定する。
 *
 * @param key - issue パスの先頭要素
 * @returns フォームの入力項目なら `true`
 */
function isSpotFormField(
  key: PropertyKey | undefined,
): key is keyof SpotFormValues {
  return typeof key === "string" && key in emptyValues("");
}

/**
 * 空のフォーム値を返す。
 *
 * @param visitedAt - 訪問日の既定値
 * @returns 全項目が未入力のフォーム値
 */
function emptyValues(visitedAt: string): SpotFormValues {
  return {
    name: "",
    categoryId: "",
    visitedAt,
    latitude: undefined,
    longitude: undefined,
    memo: "",
  };
}

/**
 * スポット登録・編集フォームの状態・検証・エラーを提供する。
 *
 * 登録モーダルと編集モーダルで共通の入力項目を持つため、状態とクライアント検証をここに集約する。
 * 送信（API 呼び出し）は持たない。`validate` が返した値を `useSpotCreate` / `useSpotEdit` に渡す。
 *
 * @param schema - 送信前に通す検証スキーマ（登録は `createSpotSchema`、編集は `updateSpotSchema`）
 * @returns フォーム値 `form`・項目別エラー `errors`・訪問日の上限 `todayStr`・
 *   初期化 `reset`・検証 `validate`
 */
export const useSpotForm = (schema: typeof createSpotSchema) => {
  // スキーマと同じく UTC 基準の当日。登録時の訪問日の既定値と、日付入力の上限に使う
  const todayStr = new Date().toISOString().split("T")[0] ?? "";

  const form = reactive<SpotFormValues>(emptyValues(todayStr));
  const errors = ref<SpotFormErrors>({});

  /**
   * フォームを初期値に戻し、エラーを消す。
   *
   * @param values - 初期値に重ねる値（編集対象のスポットの値など）。省略時は空のフォーム（訪問日は今日）
   */
  function reset(values: Partial<SpotFormValues> = {}) {
    Object.assign(form, emptyValues(todayStr), values);
    errors.value = {};
  }

  /**
   * フォームを検証し、結果を `errors` に反映する。
   *
   * 1 項目につき最初のエラーだけを表示する。
   *
   * @returns 検証済みの送信値。エラーがあれば `null`
   */
  function validate(): CreateSpotInput | null {
    const result = schema.safeParse({
      name: form.name,
      categoryId: form.categoryId,
      visitedAt: form.visitedAt,
      latitude: form.latitude,
      longitude: form.longitude,
      memo: form.memo || undefined,
    });

    const next: SpotFormErrors = {};
    // 未入力はスキーマの型エラー（英語の既定メッセージ）より先に、入力を促すメッセージにする。
    // isNaN は使わない: v-model.number が書き戻す "" は isNaN("") === false で素通りする
    if (!Number.isFinite(form.latitude)) {
      next.latitude = "緯度を入力してください";
    }
    if (!Number.isFinite(form.longitude)) {
      next.longitude = "経度を入力してください";
    }
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = issue.path[0];
        if (isSpotFormField(key) && !next[key]) next[key] = issue.message;
      }
    }

    errors.value = next;
    return result.success ? result.data : null;
  }

  return {
    form,
    errors: readonly(errors),
    todayStr,
    reset,
    validate,
  };
};
