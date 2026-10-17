import { toast } from "vue-sonner";
import { useSpotRepository } from "~/repositories/spot";

/**
 * スポットの削除を提供する。
 *
 * 結果はトースト通知で利用者に伝え、成功可否を真偽値で返す。
 *
 * @returns ローディング状態と、削除処理 `deleteSpot`
 */
export const useSpotDelete = () => {
  const spotRepository = useSpotRepository();

  const loading = ref(false);

  async function deleteSpot(id: string): Promise<boolean> {
    loading.value = true;
    try {
      await spotRepository.remove(id);
      toast.success("スポットを削除しました");
      return true;
    } catch {
      toast.error("削除に失敗しました");
      return false;
    } finally {
      loading.value = false;
    }
  }

  return {
    loading: readonly(loading),
    deleteSpot,
  };
};
