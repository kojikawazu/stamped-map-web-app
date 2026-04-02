const SORT_FIELD_MAP: Record<string, string> = {
  visited_at: "visitedAt",
  created_at: "createdAt",
};

// このアプリは個人利用の単一ユーザー設計のため、全スポットを返す。
// マルチユーザー化の際は userId フィルターを追加すること。
export default defineEventHandler(async (event) => {
  await verifyAuth(event);

  const rawQuery = getQuery(event);
  // getQuery の値型は QueryValue | QueryValue[] のため、文字列比較・数値変換には String() で正規化する
  const query = rawQuery as Record<string, string | string[]>;

  const page = Math.max(1, parseInt(String(rawQuery.page ?? "1"), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(rawQuery.limit ?? "20"), 10) || 20));
  const sortParam = String(rawQuery.sort ?? "visited_at");
  const order = rawQuery.order === "asc" ? "asc" : "desc";

  const sortField = SORT_FIELD_MAP[sortParam] ?? "visitedAt";
  const where = buildSpotWhereClause(query);

  const [spots, total] = await Promise.all([
    prisma.mapSpot.findMany({
      where,
      include: { category: true },
      orderBy: { [sortField]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.mapSpot.count({ where }),
  ]);

  return {
    data: spots.map(formatSpotResponse),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
});
