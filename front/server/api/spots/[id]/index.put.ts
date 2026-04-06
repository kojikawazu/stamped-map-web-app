import { updateSpotSchema } from "~/lib/validations/spot";

export default defineEventHandler(async (event) => {
  await verifyOwner(event);

  const id = getRouterParam(event, "id");
  if (!id || !isValidUuid(id)) {
    throw createError({ statusCode: 400, data: { code: "VALIDATION_ERROR", message: "無効なID形式です" } });
  }

  const body = await readBody(event);
  const result = updateSpotSchema.safeParse(body);

  if (!result.success) {
    throw createError({
      statusCode: 400,
      data: {
        code: "VALIDATION_ERROR",
        message: "入力内容に誤りがあります",
        details: getValidationErrorDetails(result.error),
      },
    });
  }

  const existing = await prisma.mapSpot.findUnique({ where: { id } });
  if (!existing) {
    throw createError({ statusCode: 404, data: { code: "NOT_FOUND", message: "スポットが見つかりません" } });
  }

  const { name, categoryId, latitude, longitude, visitedAt, memo } = result.data;

  const categoryExists = await prisma.mapCategory.findUnique({
    where: { id: categoryId },
  });
  if (!categoryExists) {
    throw createError({
      statusCode: 400,
      data: {
        code: "VALIDATION_ERROR",
        message: "入力内容に誤りがあります",
        details: { categoryId: "指定されたカテゴリが存在しません" },
      },
    });
  }

  const updated = await prisma.mapSpot.update({
    where: { id },
    data: {
      name,
      categoryId,
      latitude,
      longitude,
      visitedAt: new Date(visitedAt),
      memo: memo || null,
    },
    include: { category: true },
  });

  return { data: formatSpotResponse(updated) };
});
