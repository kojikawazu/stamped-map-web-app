import type { Spot, Pagination, SpotsResponse } from "~/types/spot";

/**
 * スポット一覧の取得と共有状態を提供する。
 *
 * 絞り込み・並び替え・ページ番号は `useSpotFilter` の `spotsQuery` から受け取り、
 * 一覧パネルと地図が同じ条件を参照できるようにする。
 *
 * @returns スポット一覧・ページング情報・ローディング状態・エラーと、
 *   取得処理 `fetchSpots`
 */
export const useSpots = () => {
  const { apiFetch } = useApiClient();
  const { spotsQuery } = useSpotFilter();

  const spots = useState<Spot[]>("spots:list", () => []);
  const pagination = useState<Pagination | null>(
    "spots:pagination",
    () => null,
  );
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchSpots() {
    loading.value = true;
    error.value = null;
    try {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(spotsQuery.value)) {
        params.set(key, String(value));
      }
      const res = await apiFetch<SpotsResponse>(
        `/api/spots?${params.toString()}`,
      );
      spots.value = res.data;
      pagination.value = res.pagination;
    } catch {
      error.value = "スポットの取得に失敗しました";
    } finally {
      loading.value = false;
    }
  }

  watch(spotsQuery, () => fetchSpots(), { deep: true });

  return {
    spots: readonly(spots),
    pagination: readonly(pagination),
    loading: readonly(loading),
    error: readonly(error),
    fetchSpots,
  };
};
