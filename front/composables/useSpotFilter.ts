/** 一覧の並び替え対象。API の `sort` パラメータにそのまま渡す */
export type SortField = "visited_at" | "created_at";
/** 並び順。API の `order` パラメータにそのまま渡す */
export type SortOrder = "asc" | "desc";

/**
 * スポット一覧の 1 ページあたり取得件数。
 *
 * サーバー側（`GET /api/spots`）は `limit` を 1〜100 にクランプするため、
 * この値は 100 を超えてはならない。20 は既定値と同値で、
 * 一覧パネルの縦スクロール量が過大にならない件数として選んでいる。
 *
 * 参照箇所がこのファイルに閉じているため、`typescript.md`（定数の配置）に従い
 * `constants/` へは昇格させずコロケーションのままとする。
 */
const SPOT_PAGE_SIZE = 20;

/**
 * スポットの絞り込み・並び替え・ページングの状態を一元管理する。
 *
 * 状態は `useState` で共有し、一覧パネル（`spotsQuery`）と地図マーカー
 * （`markersQuery`）が同じ条件を参照できるようにする。
 * 絞り込み条件を変える操作はページ番号を 1 に戻す。
 *
 * @returns 各絞り込み状態（読み取り専用）・API へ渡すクエリ 2 種と、
 *   検索・カテゴリ切替・並び替え・ページ移動・リセットの各操作
 */
export const useSpotFilter = () => {
  const searchQuery = useState<string>("spotFilter:search", () => "");
  const selectedCategories = useState<string[]>(
    "spotFilter:categories",
    () => [],
  );
  const sortField = useState<SortField>(
    "spotFilter:sortField",
    () => "visited_at",
  );
  const sortOrder = useState<SortOrder>("spotFilter:sortOrder", () => "desc");
  const page = useState<number>("spotFilter:page", () => 1);

  const spotsQuery = computed(() => {
    const params: Record<string, string | number> = {
      page: page.value,
      limit: SPOT_PAGE_SIZE,
      sort: sortField.value,
      order: sortOrder.value,
    };
    if (searchQuery.value) {
      params.q = searchQuery.value;
    }
    if (selectedCategories.value.length > 0) {
      params.category = selectedCategories.value.join(",");
    }
    return params;
  });

  const markersQuery = computed(() => {
    const params: Record<string, string> = {};
    if (searchQuery.value) {
      params.q = searchQuery.value;
    }
    if (selectedCategories.value.length > 0) {
      params.category = selectedCategories.value.join(",");
    }
    return params;
  });

  function setSearch(q: string) {
    searchQuery.value = q;
    page.value = 1;
  }

  function toggleCategory(id: string) {
    const idx = selectedCategories.value.indexOf(id);
    if (idx === -1) {
      selectedCategories.value = [...selectedCategories.value, id];
    } else {
      selectedCategories.value = selectedCategories.value.filter(
        (c) => c !== id,
      );
    }
    page.value = 1;
  }

  function setSort(field: SortField, order: SortOrder) {
    sortField.value = field;
    sortOrder.value = order;
    page.value = 1;
  }

  function setPage(n: number) {
    page.value = n;
  }

  function resetFilters() {
    searchQuery.value = "";
    selectedCategories.value = [];
    sortField.value = "visited_at";
    sortOrder.value = "desc";
    page.value = 1;
  }

  return {
    searchQuery: readonly(searchQuery),
    selectedCategories: readonly(selectedCategories),
    sortField: readonly(sortField),
    sortOrder: readonly(sortOrder),
    page: readonly(page),
    spotsQuery,
    markersQuery,
    setSearch,
    toggleCategory,
    setSort,
    setPage,
    resetFilters,
  };
};
