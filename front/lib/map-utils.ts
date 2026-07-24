import type { Marker } from "~/types/marker";
import type { Category } from "~/types/category";

/**
 * 文字列を HTML 特殊文字エスケープする。
 *
 * MapLibre のポップアップは HTML 文字列を直接受け取り Vue の自動エスケープが
 * 効かないため、スポット名・カテゴリ名を差し込む前に必ず通すこと。
 *
 * @param str - エスケープ対象の文字列
 * @returns `& < > " '` を実体参照に置換した文字列
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * カテゴリ一覧を「ID → カテゴリ名」の参照表に変換する。
 *
 * マーカーは `categoryId` しか持たないため、ポップアップにカテゴリ名を出す際の
 * 線形探索を避ける目的で使う。
 *
 * @param cats - カテゴリ一覧
 * @returns カテゴリ ID をキー、カテゴリ名を値とする Map
 */
export function buildCategoryMap(cats: Category[]): Map<string, string> {
  return new Map(cats.map((c) => [c.id, c.name]));
}

/**
 * マーカー一覧を MapLibre のソースに渡す GeoJSON FeatureCollection へ変換する。
 *
 * 座標は GeoJSON 仕様に従い `[経度, 緯度]` の順で格納する
 * （`Marker` のフィールド順とは逆になる点に注意）。
 *
 * @param items - 変換対象のマーカー一覧
 * @param categoryMap - `buildCategoryMap` が返すカテゴリ ID → 名前の参照表。
 *   該当 ID が無い場合、`categoryName` は空文字にフォールバックする
 * @returns 各マーカーを Point Feature とする FeatureCollection
 */
export function markersToGeoJSON(
  items: Marker[],
  categoryMap: Map<string, string>,
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: items.map((m) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [m.longitude, m.latitude],
      },
      properties: {
        id: m.id,
        name: m.name,
        color: m.categoryColor,
        categoryName: categoryMap.get(m.categoryId) ?? "",
      },
    })),
  };
}
