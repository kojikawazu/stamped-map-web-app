import type { Category } from "~/types/category";
import { useCategoryRepository } from "~/repositories/category";
import { createCategorySchema } from "~/schemas/category";

/**
 * カテゴリの新規作成を提供する。
 *
 * 送信前に `createCategorySchema` で検証し、失敗時は API を呼ばずに
 * `error` へメッセージを設定する。スポット登録モーダルからの
 * インラインカテゴリ追加でも使う。
 *
 * @returns ローディング状態・エラーと、作成処理 `createCategory`・
 *   エラーリセット `clearError`
 */
export const useCategoryCreate = () => {
  const categoryRepository = useCategoryRepository();
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function createCategory(input: {
    name: string;
    color: string;
  }): Promise<Category | null> {
    error.value = null;

    const result = createCategorySchema.safeParse(input);
    if (!result.success) {
      error.value =
        result.error.issues[0]?.message ?? "入力内容に誤りがあります";
      return null;
    }

    loading.value = true;
    try {
      return await categoryRepository.create(result.data);
    } catch {
      error.value = "カテゴリの追加に失敗しました";
      return null;
    } finally {
      loading.value = false;
    }
  }

  function clearError() {
    error.value = null;
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    createCategory,
    clearError,
  };
};
