/**
 * 地図マーカー 1 件。マーカー API がクライアントへ返す形
 * （`formatMarkerResponse` の出力）。
 *
 * 地図描画に必要な項目だけに絞った軽量版で、`Spot` が持つメモ・画像・日時を含まない。
 * 全件を一度に描画するため、ペイロードを小さく保つことを優先している。
 */
export type Marker = {
  /** 対応するスポットの UUID */
  id: string;
  /** ポップアップに表示するスポット名 */
  name: string;
  /** 緯度（-90〜90） */
  latitude: number;
  /** 経度（-180〜180） */
  longitude: number;
  /** 所属カテゴリの UUID。カテゴリ絞り込みに使う */
  categoryId: string;
  /** マーカーの塗り色。所属カテゴリの色を展開したもの（`#RRGGBB` 形式） */
  categoryColor: string;
};

/**
 * マーカー一覧 API（`GET /api/spots/markers`）のレスポンス。
 */
export type MarkersResponse = {
  /** 全スポットのマーカー。ページングはしない */
  data: Marker[];
};
