const SORT_FIELD_MAP: Record<string, string> = {
  visited_at: "visitedAt",
  created_at: "createdAt",
};

export default defineEventHandler(async (event) => {
  await verifyAuth(event);

  const query = getQuery(event) as Record<string, string>;

  const page = Math.max(1, parseInt(query.page ?? "1", 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? "20", 10) || 20));
  const sortParam = query.sort ?? "visited_at";
  const order = query.order === "asc" ? "asc" : "desc";

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
