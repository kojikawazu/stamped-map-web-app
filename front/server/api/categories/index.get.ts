export default defineEventHandler(async (event) => {
  await verifyAuth(event);

  // このアプリは個人利用の単一ユーザー設計のため、全カテゴリを返す。
  // マルチユーザー化の際は userId フィルターを追加すること。
  const categories = await prisma.mapCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { mapSpots: true } } },
  });

  const data = categories.map((cat: typeof categories[number]) =>
    formatCategoryResponse(cat, cat._count.mapSpots)
  );

  return { data };
});
