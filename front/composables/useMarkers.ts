import { useSpotRepository } from "~/repositories/spot";
import type { Marker } from "~/types/marker";

/**
 * 地図マーカーの取得と共有状態を提供する。
 *
 * 一覧と条件を揃えるため、絞り込みは `useSpotFilter` の `markersQuery` を使う。
 * ページングはせず該当する全マーカーを取得する。
 *
 * @returns マーカー一覧・ローディング状態と、取得処理 `fetchMarkers`
 */
export const useMarkers = () => {
  const spotRepository = useSpotRepository();
  const { markersQuery } = useSpotFilter();

  const markers = useState<Marker[]>("markers:list", () => []);
  const loading = ref(false);

  async function fetchMarkers() {
    loading.value = true;
    try {
      markers.value = await spotRepository.listMarkers(markersQuery.value);
    } catch {
      // マーカー取得失敗は一覧で気づけるためサイレント
    } finally {
      loading.value = false;
    }
  }

  watch(markersQuery, () => fetchMarkers(), { deep: true });

  return {
    markers: readonly(markers),
    loading: readonly(loading),
    fetchMarkers,
  };
};
