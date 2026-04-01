import { createSpotSchema } from "~/lib/validations/spot";

export default defineEventHandler(async (event) => {
  await verifyAuth(event);

  const body = await readBody(event);
  const result = createSpotSchema.safeParse(body);

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

  const spot = await prisma.mapSpot.create({
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

  setResponseStatus(event, 201);
  return { data: formatSpotResponse(spot) };
});
