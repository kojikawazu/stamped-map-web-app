import { toast } from "vue-sonner";
import type { UpdateSpotInput } from "~/lib/validations/spot";
import type { Spot } from "~/types/spot";

export const useSpotEdit = () => {
  const { apiFetch } = useApiClient();

  const loading = ref(false);
  const error = ref<string | null>(null);

  async function updateSpot(id: string, payload: UpdateSpotInput): Promise<Spot | null> {
    loading.value = true;
    error.value = null;
    try {
      const res = await apiFetch<{ data: Spot }>(`/api/spots/${id}`, {
        method: "PUT",
        body: payload,
      });
      toast.success("スポットを更新しました");
      return res.data;
    } catch {
      error.value = "スポットの更新に失敗しました";
      toast.error("更新に失敗しました");
      return null;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    updateSpot,
  };
};
