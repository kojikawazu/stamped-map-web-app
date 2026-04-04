import { describe, it, expect } from "vitest";
import { escapeHtml, buildCategoryMap, markersToGeoJSON } from "../../lib/map-utils";
import type { Category } from "../../types/category";
import type { Marker } from "../../types/marker";

describe("escapeHtml", () => {
  it("通常の文字列はそのまま返す", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World");
  });

  it("& をエスケープする", () => {
    expect(escapeHtml("A & B")).toBe("A &amp; B");
  });

  it("< をエスケープする", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("> をエスケープする", () => {
    expect(escapeHtml("a > b")).toBe("a &gt; b");
  });

  it('" をエスケープする', () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("' をエスケープする", () => {
    expect(escapeHtml("it's")).toBe("it&#039;s");
  });

  it("XSS攻撃パターンをエスケープする", () => {
    const input = '<img src="x" onerror="alert(\'xss\')">';
    const result = escapeHtml(input);
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
    expect(result).not.toContain('"');
    expect(result).not.toContain("'");
  });

  it("空文字列はそのまま返す", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("複数の特殊文字が混在している場合にすべてエスケープする", () => {
    expect(escapeHtml("<p class=\"test\">A & B</p>")).toBe(
      "&lt;p class=&quot;test&quot;&gt;A &amp; B&lt;/p&gt;"
    );
  });
});

describe("buildCategoryMap", () => {
  it("カテゴリIDと名前のマップを返す", () => {
    const categories: Category[] = [
      { id: "cat-1", name: "カフェ", color: "#FF0000", isDefault: false, sortOrder: 1, spotCount: 0 },
      { id: "cat-2", name: "レストラン", color: "#00FF00", isDefault: false, sortOrder: 2, spotCount: 0 },
    ];
    const result = buildCategoryMap(categories);
    expect(result.get("cat-1")).toBe("カフェ");
    expect(result.get("cat-2")).toBe("レストラン");
  });

  it("空配列は空のマップを返す", () => {
    const result = buildCategoryMap([]);
    expect(result.size).toBe(0);
  });

  it("存在しないIDはundefinedを返す", () => {
    const categories: Category[] = [
      { id: "cat-1", name: "カフェ", color: "#FF0000", isDefault: false, sortOrder: 1, spotCount: 0 },
    ];
    const result = buildCategoryMap(categories);
    expect(result.get("nonexistent")).toBeUndefined();
  });
});

describe("markersToGeoJSON", () => {
  const baseMarker: Marker = {
    id: "spot-1",
    name: "東京カフェ",
    latitude: 35.6812,
    longitude: 139.7671,
    categoryId: "cat-1",
    categoryColor: "#FF0000",
  };

  const categoryMap = new Map<string, string>([["cat-1", "カフェ"]]);

  it("GeoJSON FeatureCollection を返す", () => {
    const result = markersToGeoJSON([baseMarker], categoryMap);
    expect(result.type).toBe("FeatureCollection");
  });

  it("マーカー数分の Feature が含まれる", () => {
    const markers: Marker[] = [
      baseMarker,
      { ...baseMarker, id: "spot-2", name: "大阪カフェ", latitude: 34.6937, longitude: 135.5023 },
    ];
    const result = markersToGeoJSON(markers, categoryMap);
    expect(result.features).toHaveLength(2);
  });

  it("座標が [longitude, latitude] の順で設定される", () => {
    const result = markersToGeoJSON([baseMarker], categoryMap);
    const coords = result.features[0].geometry as GeoJSON.Point;
    expect(coords.coordinates[0]).toBe(baseMarker.longitude);
    expect(coords.coordinates[1]).toBe(baseMarker.latitude);
  });

  it("properties に id, name, color, categoryName が含まれる", () => {
    const result = markersToGeoJSON([baseMarker], categoryMap);
    const props = result.features[0].properties!;
    expect(props.id).toBe("spot-1");
    expect(props.name).toBe("東京カフェ");
    expect(props.color).toBe("#FF0000");
    expect(props.categoryName).toBe("カフェ");
  });

  it("categoryId がマップに存在しない場合は categoryName が空文字になる", () => {
    const markerWithUnknownCategory: Marker = { ...baseMarker, categoryId: "unknown" };
    const result = markersToGeoJSON([markerWithUnknownCategory], categoryMap);
    expect(result.features[0].properties!.categoryName).toBe("");
  });

  it("マーカーが0件のとき空の features 配列を返す", () => {
    const result = markersToGeoJSON([], categoryMap);
    expect(result.features).toHaveLength(0);
  });
});
