import { toast } from "vue-sonner";
import { updateCategorySchema } from "~/lib/validations/category";
import type { Category } from "~/types/category";

export const useCategoryManage = () => {
  const { apiFetch } = useApiClient();

  const editLoading = ref(false);
  const deleteLoading = ref(false);
  const editError = ref<string | null>(null);

  async function updateCategory(id: string, input: { name: string; color: string }): Promise<Category | null> {
    editError.value = null;

    const result = updateCategorySchema.safeParse(input);
    if (!result.success) {
      editError.value = result.error.issues[0]?.message ?? "入力内容に誤りがあります";
      return null;
    }

    editLoading.value = true;
    try {
      const res = await apiFetch<{ data: Category }>(`/api/categories/${id}`, {
        method: "PUT",
        body: result.data,
      });
      toast.success("カテゴリを更新しました");
      return res.data;
    } catch {
      editError.value = "カテゴリの更新に失敗しました";
      toast.error("更新に失敗しました");
      return null;
    } finally {
      editLoading.value = false;
    }
  }

  async function deleteCategory(id: string): Promise<boolean> {
    deleteLoading.value = true;
    try {
      await apiFetch(`/api/categories/${id}`, { method: "DELETE" });
      toast.success("カテゴリを削除しました");
      return true;
    } catch (err: unknown) {
      const message =
        (err as { data?: { message?: string } })?.data?.message ??
        "削除に失敗しました";
      toast.error(message);
      return false;
    } finally {
      deleteLoading.value = false;
    }
  }

  function clearEditError() {
    editError.value = null;
  }

  return {
    editLoading: readonly(editLoading),
    deleteLoading: readonly(deleteLoading),
    editError: readonly(editError),
    updateCategory,
    deleteCategory,
    clearEditError,
  };
};
