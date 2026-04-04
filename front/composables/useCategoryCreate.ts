import type { Category } from "~/types/category";
import { createCategorySchema } from "~/lib/validations/category";

export const useCategoryCreate = () => {
  const { apiFetch } = useApiClient();
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function createCategory(input: { name: string; color: string }): Promise<Category | null> {
    error.value = null;

    const result = createCategorySchema.safeParse(input);
    if (!result.success) {
      error.value = result.error.issues[0]?.message ?? "入力内容に誤りがあります";
      return null;
    }

    loading.value = true;
    try {
      const res = await apiFetch<{ data: Category }>("/api/categories", {
        method: "POST",
        body: result.data,
      });
      return res.data;
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

  return { loading: readonly(loading), error: readonly(error), createCategory, clearError };
};
