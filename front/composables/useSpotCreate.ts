import { toast } from "vue-sonner";
import type { CreateSpotInput } from "~/lib/validations/spot";
import type { Spot } from "~/types/spot";

/**
 * スポットの新規登録を提供する。
 *
 * 結果はトースト通知で利用者に伝え、失敗時は `null` を返す
 * （呼び出し側でモーダルを閉じるかどうかを判断できるようにするため）。
 *
 * @returns ローディング状態・エラーと、登録処理 `createSpot`
 */
export const useSpotCreate = () => {
  const { apiFetch } = useApiClient();

  const loading = ref(false);
  const error = ref<string | null>(null);

  async function createSpot(payload: CreateSpotInput): Promise<Spot | null> {
    loading.value = true;
    error.value = null;
    try {
      const spot = await apiFetch<Spot>("/api/spots", {
        method: "POST",
        body: payload,
      });
      toast.success("スポットを登録しました");
      return spot;
    } catch {
      error.value = "スポットの登録に失敗しました";
      toast.error("登録に失敗しました");
      return null;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading: readonly(loading),
    error: readonly(error),
    createSpot,
  };
};
