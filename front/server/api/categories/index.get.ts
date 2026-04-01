export default defineEventHandler(async (event) => {
  await verifyAuth(event);

  const categories = await prisma.mapCategory.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { mapSpots: true } } },
  });

  const data = categories.map((cat: typeof categories[number]) =>
    formatCategoryResponse(cat, cat._count.mapSpots)
  );

  return { data };
});
