/**
 * スポットに紐づくカテゴリ。
 *
 * スポット API のレスポンスに埋め込まれる縮約版で、カテゴリ管理画面が扱う
 * `Category` とは別物（`spotCount` や並び順を持たない）。
 */
export type SpotCategory = {
  /** カテゴリの UUID */
  id: string;
  /** カテゴリ名。全カテゴリ間で一意 */
  name: string;
  /** 地図マーカー・バッジの表示色。`#RRGGBB` 形式の 16 進カラーコード */
  color: string;
};

/**
 * スポット 1 件。Server API がクライアントへ返す形（`formatSpotResponse` の出力）。
 *
 * DB の `MapSpot` と異なり日時系はすべて文字列にシリアライズ済みで、
 * `visitedAt` だけ日付単位に丸められている点に注意。
 */
export type Spot = {
  /** スポットの UUID */
  id: string;
  /** スポット名 */
  name: string;
  /** 所属カテゴリ。スポットは必ず 1 つのカテゴリに属する */
  category: SpotCategory;
  /** 緯度（-90〜90） */
  latitude: number;
  /** 経度（-180〜180） */
  longitude: number;
  /**
   * 訪問日。`YYYY-MM-DD` 形式の日付のみで、時刻・タイムゾーンを含まない。
   * DB 側が `@db.Date` のため、ISO 日時ではなく日付単位で扱う。
   */
  visitedAt: string;
  /** メモ。未入力の場合は `null` */
  memo: string | null;
  /** 画像 URL。未設定の場合は `null` */
  imageUrl: string | null;
  /** 作成日時。ISO 8601 形式（UTC） */
  createdAt: string;
  /** 更新日時。ISO 8601 形式（UTC） */
  updatedAt: string;
};

/**
 * 一覧 API のページング情報。
 */
export type Pagination = {
  /** 現在のページ番号。1 始まり */
  page: number;
  /** 1 ページあたりの件数。サーバー側で 1〜100 にクランプされる */
  limit: number;
  /** 絞り込み条件に合致する総**件数**（総ページ数ではない） */
  total: number;
  /** 総ページ数。0 件のときも 1 を返す */
  totalPages: number;
};

/**
 * スポット一覧 API（`GET /api/spots`）のレスポンス。
 */
export type SpotsResponse = {
  /** 現在ページ分のスポット。並び順はリクエストの `sort` / `order` に従う */
  data: Spot[];
  /** ページング情報 */
  pagination: Pagination;
};
