import { describe, it, expect } from "vitest";
import {
  escapeHtml,
  buildCategoryMap,
  markersToGeoJSON,
} from "../../lib/map-utils";
import type { Category } from "../../types/category";
import type { Marker } from "../../types/marker";

describe("escapeHtml", () => {
  it("N-1: 通常の文字列はそのまま返す", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World");
  });

  it("N-2: & をエスケープする", () => {
    expect(escapeHtml("A & B")).toBe("A &amp; B");
  });

  it("N-3: < をエスケープする", () => {
    expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
  });

  it("N-4: > をエスケープする", () => {
    expect(escapeHtml("a > b")).toBe("a &gt; b");
  });

  it('N-5: " をエスケープする', () => {
    expect(escapeHtml('say "hello"')).toBe("say &quot;hello&quot;");
  });

  it("N-6: ' をエスケープする", () => {
    expect(escapeHtml("it's")).toBe("it&#039;s");
  });

  it("N-7: XSS 攻撃パターンをエスケープする", () => {
    const input = '<img src="x" onerror="alert(\'xss\')">';
    const result = escapeHtml(input);
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
    expect(result).not.toContain('"');
    expect(result).not.toContain("'");
  });

  it("S-1: 空文字列はそのまま返す（境界値）", () => {
    expect(escapeHtml("")).toBe("");
  });

  it("N-8: 複数の特殊文字が混在している場合にすべてエスケープする", () => {
    expect(escapeHtml('<p class="test">A & B</p>')).toBe(
      "&lt;p class=&quot;test&quot;&gt;A &amp; B&lt;/p&gt;",
    );
  });
});

describe("buildCategoryMap", () => {
  it("N-1: カテゴリ ID と名前のマップを返す", () => {
    const categories: Category[] = [
      {
        id: "cat-1",
        name: "カフェ",
        color: "#FF0000",
        isDefault: false,
        sortOrder: 1,
        spotCount: 0,
      },
      {
        id: "cat-2",
        name: "レストラン",
        color: "#00FF00",
        isDefault: false,
        sortOrder: 2,
        spotCount: 0,
      },
    ];
    const result = buildCategoryMap(categories);
    expect(result.get("cat-1")).toBe("カフェ");
    expect(result.get("cat-2")).toBe("レストラン");
  });

  it("S-1: 空配列は空のマップを返す（境界値）", () => {
    const result = buildCategoryMap([]);
    expect(result.size).toBe(0);
  });

  it("S-2: 存在しない ID は undefined を返す（フォールバック）", () => {
    const categories: Category[] = [
      {
        id: "cat-1",
        name: "カフェ",
        color: "#FF0000",
        isDefault: false,
        sortOrder: 1,
        spotCount: 0,
      },
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

  it("N-1: GeoJSON FeatureCollection を返す", () => {
    const result = markersToGeoJSON([baseMarker], categoryMap);
    expect(result.type).toBe("FeatureCollection");
  });

  it("N-2: マーカー数分の Feature が含まれる", () => {
    const markers: Marker[] = [
      baseMarker,
      {
        ...baseMarker,
        id: "spot-2",
        name: "大阪カフェ",
        latitude: 34.6937,
        longitude: 135.5023,
      },
    ];
    const result = markersToGeoJSON(markers, categoryMap);
    expect(result.features).toHaveLength(2);
  });

  it("N-3: 座標が [longitude, latitude] の順で設定される", () => {
    const result = markersToGeoJSON([baseMarker], categoryMap);
    const coords = result.features[0].geometry as GeoJSON.Point;
    expect(coords.coordinates[0]).toBe(baseMarker.longitude);
    expect(coords.coordinates[1]).toBe(baseMarker.latitude);
  });

  it("N-4: properties に id, name, color, categoryName が含まれる", () => {
    const result = markersToGeoJSON([baseMarker], categoryMap);
    const props = result.features[0].properties!;
    expect(props.id).toBe("spot-1");
    expect(props.name).toBe("東京カフェ");
    expect(props.color).toBe("#FF0000");
    expect(props.categoryName).toBe("カフェ");
  });

  it("S-1: categoryId がマップに存在しない場合は categoryName が空文字になる（フォールバック）", () => {
    const markerWithUnknownCategory: Marker = {
      ...baseMarker,
      categoryId: "unknown",
    };
    const result = markersToGeoJSON([markerWithUnknownCategory], categoryMap);
    expect(result.features[0].properties!.categoryName).toBe("");
  });

  it("S-2: マーカーが 0 件のとき空の features 配列を返す（境界値）", () => {
    const result = markersToGeoJSON([], categoryMap);
    expect(result.features).toHaveLength(0);
  });
});
