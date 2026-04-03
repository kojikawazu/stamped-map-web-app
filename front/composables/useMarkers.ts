import type { Marker, MarkersResponse } from "~/types/marker";

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
