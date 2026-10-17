import { useApiClient } from "~/repositories/api-client";
import type { CreateSpotInput, UpdateSpotInput } from "~/schemas/spot";
import type { Marker, MarkersResponse } from "~/types/marker";
import type { Spot, SpotsResponse } from "~/types/spot";

/**
 * パスにクエリ文字列を付ける。クエリが空なら `?` を付けない。
 *
 * @param path - API のパス（例: `/api/spots`）
 * @param query - クエリパラメータ。値は文字列化して送る
 * @returns クエリ付きの URL
 */
function withQuery(
  path: string,
  query: Record<string, string | number>,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

/**
 * スポット API（`/api/spots`）へのアクセスを提供する。
 *
 * 認証ヘッダーを付与する `apiFetch` を setup 時に確保するため、
 * composable の同期実行部分（`await` より前）で呼ぶこと。
 *
 * @returns スポットの一覧・マーカー取得・登録・更新・削除を行う関数群
 */
export const useSpotRepository = () => {
  const { apiFetch } = useApiClient();

  return {
    /**
     * スポット一覧を 1 ページ分取得する。
     *
     * @param query - 絞り込み・並び替え・ページング条件（`useSpotFilter` の `spotsQuery`）
     * @returns 現在ページのスポットとページング情報
     */
    list: (query: Record<string, string | number>) =>
      apiFetch<SpotsResponse>(withQuery("/api/spots", query)),

    /**
     * 地図マーカーを全件取得する（ページングしない）。
     *
     * @param query - 絞り込み条件（`useSpotFilter` の `markersQuery`）
     * @returns 条件に合致する全マーカー
     */
    listMarkers: async (query: Record<string, string>): Promise<Marker[]> => {
      const res = await apiFetch<MarkersResponse>(
        withQuery("/api/spots/markers", query),
      );
      return res.data;
    },

    /**
     * スポットを登録する。
     *
     * @param input - 登録内容（`createSpotSchema` で検証済みの値）
     * @returns 登録されたスポット
     */
    create: async (input: CreateSpotInput): Promise<Spot> => {
      const res = await apiFetch<{ data: Spot }>("/api/spots", {
        method: "POST",
        body: input,
      });
      return res.data;
    },

    /**
     * スポットを更新する（全項目を送る）。
     *
     * @param id - 対象スポットの UUID
     * @param input - 更新内容（`updateSpotSchema` で検証済みの値）
     * @returns 更新後のスポット
     */
    update: async (id: string, input: UpdateSpotInput): Promise<Spot> => {
      const res = await apiFetch<{ data: Spot }>(`/api/spots/${id}`, {
        method: "PUT",
        body: input,
      });
      return res.data;
    },

    /**
     * スポットを削除する。
     *
     * @param id - 対象スポットの UUID
     */
    remove: async (id: string): Promise<void> => {
      await apiFetch(`/api/spots/${id}`, { method: "DELETE" });
    },
  };
};
