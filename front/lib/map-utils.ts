import type { Marker } from "~/types/marker";
import type { Category } from "~/types/category";

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export function buildCategoryMap(cats: Category[]): Map<string, string> {
  return new Map(cats.map((c) => [c.id, c.name]));
}

export function markersToGeoJSON(items: Marker[], categoryMap: Map<string, string>): GeoJSON.FeatureCollection {
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
