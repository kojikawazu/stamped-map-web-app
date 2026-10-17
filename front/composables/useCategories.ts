import { useCategoryRepository } from "~/repositories/category";
import type { Category } from "~/types/category";

/**
 * カテゴリ一覧の取得と共有状態を提供する。
 *
 * 一覧は `useState` でアプリ全体に共有し、フィルター UI と管理モーダルが
 * 同じデータを参照できるようにする。
 *
 * @returns カテゴリ一覧・ローディング状態・エラーと、取得処理 `fetchCategories`
 */
export const useCategories = () => {
  const categoryRepository = useCategoryRepository();

  const categories = useState<Category[]>("categories:list", () => []);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchCategories() {
    loading.value = true;
    error.value = null;
    try {
      categories.value = await categoryRepository.list();
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
