export default defineEventHandler(async (event) => {
  await verifyAuth(event);

  const id = getRouterParam(event, "id");
  if (!id || !isValidUuid(id)) {
    throw createError({ statusCode: 400, data: { code: "VALIDATION_ERROR", message: "無効なID形式です" } });
  }

  const existing = await prisma.mapSpot.findUnique({ where: { id } });
  if (!existing) {
    throw createError({ statusCode: 404, data: { code: "NOT_FOUND", message: "スポットが見つかりません" } });
  }

  await prisma.mapSpot.delete({ where: { id } });

  return { data: { id, message: "Spot deleted successfully" } };
});
