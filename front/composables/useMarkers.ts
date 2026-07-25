import type { Marker, MarkersResponse } from "~/types/marker";

/**
 * 地図マーカーの取得と共有状態を提供する。
 *
 * 一覧と条件を揃えるため、絞り込みは `useSpotFilter` の `markersQuery` を使う。
 * ページングはせず該当する全マーカーを取得する。
 *
 * @returns マーカー一覧・ローディング状態と、取得処理 `fetchMarkers`
 */
export const useMarkers = () => {
  const { apiFetch } = useApiClient();
  const { markersQuery } = useSpotFilter();

  const markers = useState<Marker[]>("markers:list", () => []);
  const loading = ref(false);

  async function fetchMarkers() {
    loading.value = true;
    try {
      const params = new URLSearchParams();
      for (const [key, value] of Object.entries(markersQuery.value)) {
        params.set(key, value);
      }
      const query = params.toString();
      const url = query ? `/api/spots/markers?${query}` : "/api/spots/markers";
      const res = await apiFetch<MarkersResponse>(url);
      markers.value = res.data;
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
