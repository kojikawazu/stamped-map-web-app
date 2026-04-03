import type { Category, CategoriesResponse } from "~/types/category";

export const useCategories = () => {
  const { apiFetch } = useApiClient();

  const categories = useState<Category[]>("categories:list", () => []);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchCategories() {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiFetch<CategoriesResponse>("/api/categories");
      categories.value = res.data;
    } catch {
      error.value = "カテゴリの取得に失敗しました";
    } finally {
      loading.value = false;
    }
  }

  return {
    categories: readonly(categories),
    loading: readonly(loading),
    error: readonly(error),
    fetchCategories,
  };
};
