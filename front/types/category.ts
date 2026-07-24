/**
 * カテゴリ 1 件。カテゴリ管理 API がクライアントへ返す形
 * （`formatCategoryResponse` の出力）。
 *
 * スポットに埋め込まれる `SpotCategory` とは別物で、こちらは管理 UI 向けに
 * 並び順・使用状況まで含む。
 */
export type Category = {
  /** カテゴリの UUID */
  id: string;
  /** カテゴリ名。全カテゴリ間で一意 */
  name: string;
  /** 地図マーカー・バッジの表示色。`#RRGGBB` 形式の 16 進カラーコード */
  color: string;
  /**
   * デフォルトカテゴリかどうか。
   * `true` のカテゴリは削除できない（削除時に 400 `DEFAULT_CATEGORY_DELETE`）。
   */
  isDefault: boolean;
  /** 一覧の表示順。昇順でソートされる */
  sortOrder: number;
  /**
   * このカテゴリに紐づくスポット数。
   * 1 件以上あるカテゴリは削除できない（削除時に 400 `CATEGORY_IN_USE`）。
   */
  spotCount: number;
};

/**
 * カテゴリ一覧 API（`GET /api/categories`）のレスポンス。
 */
export type CategoriesResponse = {
  /** 全カテゴリ。`sortOrder` の昇順 */
  data: Category[];
};
