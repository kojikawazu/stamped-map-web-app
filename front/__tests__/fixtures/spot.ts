import type { Pagination, Spot } from "~/types/spot";

/**
 * テスト用のスポットを生成する。必要なフィールドだけ上書きして使う。
 *
 * `visitedAt` は表示整形（`YYYY-MM-DD` → `YYYY/MM/DD`）を検証できるよう固定値にしている。
 *
 * @param overrides - 既定値を上書きするフィールド
 * @returns API レスポンスと同じ形のスポット
 */
export function buildSpot(overrides: Partial<Spot> = {}): Spot {
  return {
    id: "spot-1",
    name: "東京タワー",
    category: { id: "cat-1", name: "観光", color: "#E74C3C" },
    latitude: 35.6586,
    longitude: 139.7454,
    visitedAt: "2026-01-02",
    memo: null,
    imageUrl: null,
    createdAt: "2026-01-02T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

/**
 * テスト用のページング情報を生成する。
 *
 * @param overrides - 既定値（5 ページ中 1 ページ目・総 100 件）を上書きするフィールド
 * @returns 一覧 API と同じ形のページング情報
 */
export function buildPagination(
  overrides: Partial<Pagination> = {},
): Pagination {
  return { page: 1, limit: 20, total: 100, totalPages: 5, ...overrides };
}
