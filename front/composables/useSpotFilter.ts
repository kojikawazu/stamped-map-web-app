export type SortField = "visited_at" | "created_at";
export type SortOrder = "asc" | "desc";

export const useSpotFilter = () => {
  const searchQuery = useState<string>("spotFilter:search", () => "");
  const selectedCategories = useState<string[]>(
    "spotFilter:categories",
    () => []
  );
  const sortField = useState<SortField>(
    "spotFilter:sortField",
    () => "visited_at"
  );
  const sortOrder = useState<SortOrder>(
    "spotFilter:sortOrder",
    () => "desc"
  );
  const page = useState<number>("spotFilter:page", () => 1);

  const spotsQuery = computed(() => {
    const params: Record<string, string | number> = {
      page: page.value,
      limit: 20,
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
        (c) => c !== id
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
