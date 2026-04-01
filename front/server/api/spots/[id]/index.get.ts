export default defineEventHandler(async (event) => {
  await verifyAuth(event);

  const id = getRouterParam(event, "id");
  if (!id || !isValidUuid(id)) {
    throw createError({ statusCode: 400, data: { code: "VALIDATION_ERROR", message: "無効なID形式です" } });
  }

  const spot = await prisma.mapSpot.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!spot) {
    throw createError({ statusCode: 404, data: { code: "NOT_FOUND", message: "スポットが見つかりません" } });
  }

  return { data: formatSpotResponse(spot) };
});
