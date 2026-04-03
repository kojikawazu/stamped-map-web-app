import { describe, it, expect, beforeEach } from "vitest";
import { useSpotFilter } from "../../composables/useSpotFilter";

describe("useSpotFilter", () => {
  let filter: ReturnType<typeof useSpotFilter>;

  beforeEach(() => {
    filter = useSpotFilter();
    filter.resetFilters();
  });

  // --- 正常系 ---

  it("N-1: 初期状態が正しい", () => {
    expect(filter.searchQuery.value).toBe("");
    expect(filter.selectedCategories.value).toEqual([]);
    expect(filter.sortField.value).toBe("visited_at");
    expect(filter.sortOrder.value).toBe("desc");
    expect(filter.page.value).toBe(1);
  });

  it("N-2: setSearch で検索クエリが更新され page が 1 にリセットされる", () => {
    filter.setPage(3);
    filter.setSearch("東京");
    expect(filter.searchQuery.value).toBe("東京");
    expect(filter.page.value).toBe(1);
  });

  it("N-3: toggleCategory でカテゴリが追加され page が 1 にリセットされる", () => {
    filter.setPage(3);
    filter.toggleCategory("cat-1");
    expect(filter.selectedCategories.value).toEqual(["cat-1"]);
    expect(filter.page.value).toBe(1);
  });

  it("N-4: toggleCategory で同じ ID を再度押すと除外される", () => {
    filter.toggleCategory("cat-1");
    filter.toggleCategory("cat-1");
    expect(filter.selectedCategories.value).toEqual([]);
  });

  it("N-5: setSort でソート条件が変わり page が 1 にリセットされる", () => {
    filter.setPage(3);
    filter.setSort("created_at", "asc");
    expect(filter.sortField.value).toBe("created_at");
    expect(filter.sortOrder.value).toBe("asc");
    expect(filter.page.value).toBe(1);
  });

  it("N-6: setPage でページが変わる", () => {
    filter.setPage(3);
    expect(filter.page.value).toBe(3);
  });

  it("N-7: resetFilters で全状態が初期値に戻る", () => {
    filter.setSearch("東京");
    filter.toggleCategory("cat-1");
    filter.setSort("created_at", "asc");
    filter.setPage(5);

    filter.resetFilters();

    expect(filter.searchQuery.value).toBe("");
    expect(filter.selectedCategories.value).toEqual([]);
    expect(filter.sortField.value).toBe("visited_at");
    expect(filter.sortOrder.value).toBe("desc");
    expect(filter.page.value).toBe(1);
  });

  it("N-8: spotsQuery にフィルター条件が正しく反映される", () => {
    filter.setSearch("東京");
    filter.toggleCategory("cat-1");
    const query = filter.spotsQuery.value;
    expect(query.q).toBe("東京");
    expect(query.category).toBe("cat-1");
    expect(query.page).toBe(1);
    expect(query.limit).toBe(20);
  });

  it("N-9: markersQuery はページネーション情報を含まない", () => {
    filter.setSearch("東京");
    filter.toggleCategory("cat-1");
    const query = filter.markersQuery.value;
    expect(query).not.toHaveProperty("page");
    expect(query).not.toHaveProperty("limit");
    expect(query).not.toHaveProperty("sort");
    expect(query).not.toHaveProperty("order");
    expect(query.q).toBe("東京");
  });

  it("N-10: 複数カテゴリ選択時はカンマ区切りになる", () => {
    filter.toggleCategory("cat-1");
    filter.toggleCategory("cat-2");
    expect(filter.markersQuery.value.category).toBe("cat-1,cat-2");
  });

  // --- 準正常系 ---

  it("S-1: フィルター変更時に page が 1 にリセットされる", () => {
    filter.setPage(3);
    filter.setSearch("東京");
    expect(filter.page.value).toBe(1);
  });

  it("S-2: searchQuery が空のとき spotsQuery に q が含まれない", () => {
    filter.setSearch("");
    const query = filter.spotsQuery.value;
    expect(query).not.toHaveProperty("q");
  });

  it("S-3: selectedCategories が空のとき spotsQuery に category が含まれない", () => {
    filter.resetFilters();
    const query = filter.spotsQuery.value;
    expect(query).not.toHaveProperty("category");
  });
});
