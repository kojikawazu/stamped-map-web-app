import type { z } from "zod";

// --- Response Formatters ---

// 整形関数の引数型。Prisma のレコードのうち、整形に必要な形だけを構造的に受ける
// （PrismaClient の生成型に依存させないことで、テストから素のオブジェクトを渡せる）。
// 参照が本ファイルに閉じているため typescript.md の昇格基準に従い types/ へは出さない。

/** `formatSpotResponse` が必要とするスポットレコードの形 */
type SpotRecord = {
  id: string;
  name: string;
  category: { id: string; name: string; color: string };
  latitude: number;
  longitude: number;
  visitedAt: Date;
  memo: string | null;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

/** `formatMarkerResponse` が必要とするスポットレコードの形（地図描画に使う項目のみ） */
type MarkerRecord = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  categoryId: string;
  category: { color: string };
};

/** `formatCategoryResponse` が必要とするカテゴリレコードの形 */
type CategoryRecord = {
  id: string;
  name: string;
  color: string;
  isDefault: boolean;
  sortOrder: number;
};

/**
 * Prisma のスポットレコードを API レスポンス形式へ整形する。
 *
 * `Date` 型をシリアライズし、`visitedAt` は DB が `@db.Date` のため
 * 時刻を落として `YYYY-MM-DD` に丸める（`createdAt` / `updatedAt` は ISO 8601 のまま）。
 *
 * @param spot - カテゴリを include した Prisma の `MapSpot` レコード
 * @returns クライアントへ返す `Spot` 形式のオブジェクト
 */
export function formatSpotResponse(spot: SpotRecord) {
  return {
    id: spot.id,
    name: spot.name,
    category: {
      id: spot.category.id,
      name: spot.category.name,
      color: spot.category.color,
    },
    latitude: spot.latitude,
    longitude: spot.longitude,
    visitedAt: spot.visitedAt.toISOString().split("T")[0],
    memo: spot.memo,
    imageUrl: spot.imageUrl,
    createdAt: spot.createdAt.toISOString(),
    updatedAt: spot.updatedAt.toISOString(),
  };
}

/**
 * Prisma のスポットレコードを地図マーカー用の軽量形式へ整形する。
 *
 * 全件を一度に返すエンドポイント向けにペイロードを絞り、
 * カテゴリの色だけを `categoryColor` としてフラットに展開する。
 *
 * @param spot - カテゴリの色を include した Prisma の `MapSpot` レコード
 * @returns クライアントへ返す `Marker` 形式のオブジェクト
 */
export function formatMarkerResponse(spot: MarkerRecord) {
  return {
    id: spot.id,
    name: spot.name,
    latitude: spot.latitude,
    longitude: spot.longitude,
    categoryId: spot.categoryId,
    categoryColor: spot.category.color,
  };
}

/**
 * Prisma のカテゴリレコードを API レスポンス形式へ整形する。
 *
 * スポット件数は集計クエリ（`_count`）から別途渡す設計で、
 * レコード自体には含まれないため引数で受け取る。
 *
 * @param category - Prisma の `MapCategory` レコード
 * @param spotCount - このカテゴリに紐づくスポット数
 * @returns クライアントへ返す `Category` 形式のオブジェクト
 */
export function formatCategoryResponse(
  category: CategoryRecord,
  spotCount: number,
) {
  return {
    id: category.id,
    name: category.name,
    color: category.color,
    isDefault: category.isDefault,
    sortOrder: category.sortOrder,
    spotCount,
  };
}

// --- Query Builders ---

/**
 * スポット検索のクエリパラメータを Prisma の WHERE 句へ変換する。
 *
 * `category`（カンマ区切りの ID）と `q`（名前の部分一致）に対応し、
 * 両方指定された場合は AND 条件で結合する。値が空の条件は無視する。
 * 文字列連結ではなく Prisma のパラメータバインディングに渡す前提。
 *
 * @param query - `getQuery(event)` が返すクエリパラメータ。
 *   配列で渡された場合は最初の要素のみ使用する
 * @returns Prisma の `where` に渡すオブジェクト。条件が無ければ空オブジェクト
 */
export function buildSpotWhereClause(query: Record<string, string | string[]>) {
  const where: Record<string, unknown> = {};
  const conditions: Record<string, unknown>[] = [];

  const category = query.category;
  if (category) {
    const ids = (Array.isArray(category) ? category[0] : category)
      .split(",")
      .filter(Boolean);
    if (ids.length > 0) {
      conditions.push({ categoryId: { in: ids } });
    }
  }

  const q = query.q;
  if (q) {
    conditions.push({
      name: { contains: Array.isArray(q) ? q[0] : q, mode: "insensitive" },
    });
  }

  if (conditions.length > 0) {
    where.AND = conditions;
  }

  return where;
}

// --- Validation ---

const uuidRegex =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * 文字列が UUID 形式かどうかを判定する。
 *
 * 不正な ID で DB へ問い合わせる前に 400 を返すためのガード。
 * バージョンは区別せず、大文字小文字も許容する。
 *
 * @param id - 判定対象の文字列
 * @returns UUID 形式なら `true`
 */
export function isValidUuid(id: string): boolean {
  return uuidRegex.test(id);
}

/**
 * Zod の検証エラーを「フィールド名 → メッセージ」のマップへ変換する。
 *
 * フォームが項目ごとにエラーを表示できる形に整える。同一フィールドに
 * 複数のエラーがある場合は**最初の 1 件のみ**を採用する。
 *
 * @param zodError - `safeParse` が返した Zod のエラー
 * @returns ドット区切りのフィールドパスをキー、エラーメッセージを値とするマップ
 */
export function getValidationErrorDetails(zodError: z.core.$ZodError) {
  const details: Record<string, string> = {};
  for (const issue of zodError.issues) {
    const field = issue.path.join(".");
    if (!details[field]) {
      details[field] = issue.message;
    }
  }
  return details;
}
