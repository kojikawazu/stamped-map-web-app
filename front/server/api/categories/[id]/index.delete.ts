export default defineEventHandler(async (event) => {
  await verifyOwner(event);

  const id = getRouterParam(event, "id");
  if (!id || !isValidUuid(id)) {
    throw createError({ statusCode: 400, data: { code: "VALIDATION_ERROR", message: "無効なID形式です" } });
  }

  const category = await prisma.mapCategory.findUnique({
    where: { id },
    include: { _count: { select: { mapSpots: true } } },
  });

  if (!category) {
    throw createError({ statusCode: 404, data: { code: "NOT_FOUND", message: "カテゴリが見つかりません" } });
  }

  if (category.isDefault) {
    throw createError({
      statusCode: 400,
      data: { code: "DEFAULT_CATEGORY_DELETE", message: "デフォルトカテゴリは削除できません" },
    });
  }

  if (category._count.mapSpots > 0) {
    throw createError({
      statusCode: 400,
      data: { code: "CATEGORY_IN_USE", message: "スポットが紐づいているカテゴリは削除できません" },
    });
  }

  await prisma.mapCategory.delete({ where: { id } });

  return { data: { id, message: "Category deleted successfully" } };
});
